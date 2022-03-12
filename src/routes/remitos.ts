import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys } from '../utils/utils';

const router = express.Router();

router.post('/items', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next ) => {
  const values = req.body;

  try {
    const items = await knex('MovimientosDet')
      .innerJoin('Envases', 'Envases.EnvaseID', 'MovimientosDet.EnvaseID')
      .whereIn('MovimientoEncID', values)
      .select('MovimientosDet.*', 'Envases.EnvaseNombre');

    res.status(200).json(camelizeKeys(items));
  } catch (err) {
    next(err);
  }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values = req.body;

  try {
    for (let i = 0; i < values.length; i++) {
      let remito = values[i];
      const movimientosDet = await knex('MovimientosDet')
        .where({MovimientoEncID: remito.MovimientoEncID})

      remito.total = movimientosDet.reduce((acc, curr) => {
        return acc + curr.Monto
      }, 0);
    }

    await knex('Remitos').insert(values);

    res.status(200).json({});
  } catch (err) {
    next(err);
  }
});

export default router;
