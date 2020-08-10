import * as R from 'ramda';
import * as moment from 'moment';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';
import AuditoriaService from '../services/AuditoriaService';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const { withStock } = req.query;
  try {
    const comercios = await knex('Comercios').select('*');

    if (withStock) {
      for (let i = 0; i < comercios.length; i++) {
        let c = comercios[i];

        c.stock = await getStockComercio(c);
      }
    }

    res.status(200).json(camelizeKeys(comercios));
  } catch (err) {
    next(err);
  }
});

router.get('/:comercio_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const comercio_id = req.params.comercio_id;

  try {
    const comercio = await knex('Comercios').where({ id: comercio_id }).first();
    res.status(200).json(camelizeKeys(comercio));
  } catch (err) {
    next(err);
  }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = req.body;
  values.Estado = true;

  try {
    const comercio = (await knex('Comercios').insert(values, '*'))[0];
    AuditoriaService.log('comercios', comercio.id, JSON.stringify(comercio), 'insert', req.user.username);
    res.status(200).json(camelizeKeys(comercio));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.put('/:comercio_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const comercio_id = req.params.comercio_id;
  const values: any = R.omit(['id'], req.body);

  try {
    const comercio = await knex('Comercios').where({ id: comercio_id }).first();

    if (comercio) {
      const updatedComercio = (await knex('Comercios').where({ id: comercio_id }).update(values, '*'))[0];
      AuditoriaService.log('comercios', updatedComercio.id, JSON.stringify(updatedComercio), 'update', req.user.username);
      res.status(200).json(camelizeKeys(updatedComercio));
    } else {
      res.status(404).json({ error: `Comercio ID: ${comercio_id} no existe.` });
    }
  } catch (err) {
    next(err);
  }
});

router.get('/pedidos', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  try {
    const pedidos = await knex('PedidosComercios')
      .select('PedidosComercios.*', 'Comercios.razon_social', 'Comercios.calle', 'Comercios.altura', 'Comercios.telefono')
      .innerJoin('Comercios', 'Comercios.id', 'PedidosComercios.comercio_id')
      .where({ entregado: false });

    res.status(200).json(camelizeKeys(pedidos));
  } catch (err) {
    next(err);
  }
});

router.post('/pedidos', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = req.body;

  try {
    const pedido = (await knex('PedidosComercios').insert(values, '*'))[0];
    AuditoriaService.log('pedidos_comercios', pedido.id, JSON.stringify(pedido), 'insert', req.user.username);
    res.status(200).json(pedido);
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.post('/pedidos/entregar', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const ids: any = req.body;
  try {
    const pedidos = await knex('PedidosComercios').whereIn('id', ids);
    await Promise.all(pedidos.map(async p => {
      // Reducir stock punto de entrega
      const items = await knex('MovimientosDet').where({ MovimientoEncID: p.movimiento_enc_id });
      const stock = items.map(i => ({
        tipo: 'venta',
        fecha: p.fecha,
        envase_id: i.EnvaseID,
        cantidad: i.Cantidad * -1,
        comercio_id: p.comercio_id,
        movimiento_enc_id: p.movimiento_enc_id
      }));

      await knex('StockComercios').insert(stock, '*');

      // Cambiar estado pedido a entregado
      await knex('MovimientosEnc')
        .update({ EstadoMovimientoID: 3 }, '*')
        .where({ MovimientoEncID: p.movimiento_enc_id });

      // Si el pedido no fue pagado, generar movimiento cuenta corriente en punto de entrega
      if (!p.pagado) {
        const total = (await knex('MovimientosDet')
          .sum('Monto as total')
          .where({MovimientoEncID: p.movimiento_enc_id}))[0].total;

        const ctacte = {
          tipo: 'credito',
          fecha: moment().format('YYYY-MM-DD'),
          monto: total,
          comercio_id: p.comercio_id,
          pedido_id: p.id,
        };

        await knex('CuentaCorrienteComercios').insert(ctacte, '*');
      }

      // Cambiar el esatdo de la entrega a entregado
      await knex('PedidosComercios')
        .update({ entregado: true }, '*')
        .where({ id: p.id });
    }));

    res.status(200).json(camelizeKeys(pedidos));
  } catch (err) {
    next(err);
  }
});

router.post('/stock', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = req.body;

  try {
    const stock = (await knex('StockComercios').insert(values, '*'))[0];
    await createStockInterno(values[0].fecha, values[0].comprobante, values);
    AuditoriaService.log('stock_comercios', stock.id, JSON.stringify(stock), 'insert', req.user.username);
    res.status(200).json(stock);
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

async function getStockComercio(comercio) {
  const stock = await knex('StockComercios')
    .select('envase_id')
    .sum('cantidad as cantidad')
    .groupBy('envase_id')
    .where({ comercio_id: comercio.id });

  const reserva = await knex('PedidosComercios')
    .innerJoin('MovimientosEnc', 'PedidosComercios.movimiento_enc_id', 'MovimientosEnc.MovimientoEncID')
    .innerJoin('MovimientosDet', 'MovimientosEnc.MovimientoEncID', 'MovimientosDet.MovimientoEncID')
    .select('MovimientosDet.EnvaseID as envase_id')
    .sum('MovimientosDet.EnvaseID as cantidad')
    .groupBy('MovimientosDet.EnvaseID')
    .where({ comercio_id: comercio.id, entregado: false });

  return stock.map(s => {
    const envase = reserva.find(r => r.envase_id === s.envase_id);

    if (envase) {
      s.cantidad -= envase.cantidad;
    }

    return s;
  });
}

async function createStockInterno(fecha, comprobante, items) {
  let stock: any = {
    Fecha: fecha,
    TipoMovimiento: 'Reposicion Punto Entrega',
    Modulo: 'Stock',
    NroComprobante: comprobante
  };

  stock = (await knex('MovimientosStockEnc').insert(stock, '*'))[0];

  if (stock) {
    const stockItems = items.map(v => ({
      MovimientoStockEncID: stock.MovimientoStockEncID,
      EnvaseID: v.envase_id,
      EstadoEnvaseID: 1,
      Cantidad: v.cantidad * -1
    }));

    await knex('MovimientosStockDet').insert(stockItems, '*');
  }
}

export default router;
