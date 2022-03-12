import * as moment from 'moment';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

router.get('/:hoja_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const hoja_id = req.params.hoja_id;

  try {
    const movimientos = await knex('MovimientosEnc').where({ HojaRutaID: hoja_id });
    await Promise.all(movimientos.map(async m => {
      const detalle = await knex('MovimientosDet').where({ MovimientoEncID: m.MovimientoEncID });
      camelizeKeys(detalle);
      m.items = camelizeKeys(detalle);
    }));
    res.status(200).json(camelizeKeys(movimientos));
  } catch (err) {
    next(err);
  }
});

router.get('/movimiento/:movimiento_enc_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const movimiento_enc_id = req.params.movimiento_enc_id;

  try {
    const movimiento = await knex('MovimientosEnc').where({ MovimientoEncID: movimiento_enc_id }).first();
    console.log('movimiento_enc_id', movimiento_enc_id);
    console.log('movimiento', movimiento);
    const items = await knex('MovimientosDet').where({ MovimientoEncID: movimiento.MovimientoEncID });
    movimiento.items = camelizeKeys(items);
    res.status(200).json(camelizeKeys(movimiento));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.post('/search', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const filters = req.body;

  try {
    let query = knex('MovimientosEnc')
      .leftOuterJoin('HojasRuta', 'HojasRuta.HojaRutaID', 'MovimientosEnc.HojaRutaID')
      //.leftOuterJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
      .leftOuterJoin('Clientes', 'Clientes.ClienteID', 'MovimientosEnc.ClienteID')
      .distinct('MovimientosEnc.MovimientoEncID')
      .orderBy('MovimientosEnc.MovimientoEncID');

    if (filters.desde && filters.hasta) {
      const desde = moment(filters.desde, 'DD-MM-YYYY').format('YYYY-MM-DD');
      const hasta = moment(filters.hasta, 'DD-MM-YYYY').format('YYYY-MM-DD');
      query = query.andWhere(function() {
        this
          .andWhere('MovimientosEnc.Fecha', '>=', desde)
          .andWhere('MovimientosEnc.Fecha', '<=', hasta);
      });
    }

    if (filters.chofer) {
      query = query.andWhere(function() {
        for (let value of Object.values(filters.chofer)) {
          this.orWhere('HojasRuta.ChoferID', `${value}`);
        }
      });
    }

    if (filters.estado) {
      query = query.andWhere(function() {
        for (let value of Object.values(filters.estado)) {
          this.orWhere('MovimientosEnc.EstadoMovimientoID', `${value}`);
        }
      });
    }

    if (filters.tipos) {
      query = query.andWhere(function() {
        for (let value of Object.values(filters.tipos)) {
          this.orWhere('MovimientosEnc.TipoMovimientoID', `${value}`);
        }
      });
    }

    if (filters.condicion) {
      query = query.andWhere(function() {
        for (let value of Object.values(filters.condicion)) {
          this.orWhere('MovimientosEnc.CondicionVentaID', `${value}`);
        }
      });
    }

    if (filters.canal) {
      query = query.andWhere(function() {
        for (let value of Object.values(filters.canal)) {
          this.orWhere('Clientes.CanalID', `${value}`);
        }
      });
    }

    console.log('knex query string: ', query.toString());

    let innerResult = ((await query) || [])
      .map((res: any) => res.MovimientoEncID)
      .filter(val => val);

    const result = await knex('viewMonitor').whereIn('MovimientoEncID', innerResult).timeout(30000);

    res.send(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);

  try {
    const movimiento = (await knex('MovimientosEnc').insert(values, '*'))[0];
    res.status(200).json(camelizeKeys(movimiento));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.post('/:movimiento_enc_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);

  try {
    const items = await knex('MovimientosDet').insert(values, '*');
    res.status(200).json(camelizeKeys(items));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.put('/actualizacion_masiva', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values = req.body;
  const ids = values.ids;
  const actualizaciones = formatKeys(values.actualizaciones);
  console.log('ids', ids);
  console.log('actualizaciones', actualizaciones);

  try {
    await knex('MovimientosEnc')
      .update(actualizaciones, '*')
      .whereIn('MovimientoEncID', ids);

    res.status(200).json('ok');
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.put('/:movimiento_enc_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);

  try {
    for (let i = 0; i < values.length; i++) {
      const v = values[i];

      if (v.movimientodetid) {
        const id = v.movimientodetid;
        const updateRow = formatKeys(v, 'movimientodetid');
        await knex('MovimientosDet').where({ MovimientoDetID: id }).update(updateRow, '*');
      } else {
        await knex('MovimientosDet').insert(v, '*');
      }
    }

    const items = [];
    res.status(200).json(camelizeKeys(items));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.put('/movimiento/:movimiento_enc_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const movimiento_enc_id = req.params.movimiento_enc_id;
  const values: any = formatKeys(req.body);

  try {
    const movimiento = (await knex('MovimientosEnc').where({ MovimientoEncID: movimiento_enc_id }).update(values, '*'))[0];
    res.status(200).json(camelizeKeys(movimiento));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

export default router;
