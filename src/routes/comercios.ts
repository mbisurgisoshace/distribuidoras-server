import * as express from 'express';
import * as R from 'ramda';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";
import AuditoriaService from "../services/AuditoriaService";

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
    const comercio = await knex('Comercios').where({id: comercio_id}).first();
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
    const comercio = await knex('Comercios').where({id: comercio_id}).first();

    if (comercio) {
      const updatedComercio = (await knex('Comercios').where({id: comercio_id}).update(values, '*'))[0];
      AuditoriaService.log('comercios', updatedComercio.id, JSON.stringify(updatedComercio), 'update', req.user.username);
      res.status(200).json(camelizeKeys(updatedComercio));
    } else {
      res.status(404).json({error: `Comercio ID: ${comercio_id} no existe.`});
    }
  } catch (err) {
    next(err);
  }
});

router.post('/pedidos', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = req.body;

  try {
    const pedido = (await knex('PedidosComercios').insert(values, '*'))[0];
    AuditoriaService.log('pedidos_comercios', pedido.id, JSON.stringify(pedido), 'insert', req.user.username);
    res.status(200).json(camelizeKeys(pedido));
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
    .where({comercio_id: comercio.id});

  const reserva = await knex('PedidosComercios')
    .innerJoin('MovimientosEnc', 'PedidosComercios.movimiento_enc_id', 'MovimientosEnc.MovimientoEncID')
    .innerJoin('MovimientosDet', 'MovimientosEnc.MovimientoEncID', 'MovimientosDet.MovimientoEncID')
    .select('MovimientosDet.EnvaseID as envase_id')
    .sum('MovimientosDet.EnvaseID as cantidad')
    .groupBy('MovimientosDet.EnvaseID')
    .where({comercio_id: comercio.id, entregado: false});

  return stock.map(s => {
    const envase = reserva.find(r => r.envase_id === s.envase_id);

    if (envase) {
      s.cantidad -= envase.cantidad;
    }

    return s;
  });
}

export default router;
