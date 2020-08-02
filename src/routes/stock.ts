import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

router.get('/columnasStock', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  try {
    const columnasStock = await knex('ColumnasStock').select('*');
    res.status(200).json(columnasStock);
  } catch (err) {
    next(err);
  }
});

router.post('/columnasStock', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values = req.body;

  try {
    const columnaStock = (await knex('ColumnasStock').insert(values, '*'))[0];

    res.status(200).json(columnaStock);
  } catch (err) {
    next(err);
  }
});

router.post('/movimientos', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);

  try {
    const movimiento = (await knex('MovimientosStockEnc').insert(values, '*'))[0];

    res.status(200).json(camelizeKeys(movimiento));
  } catch (err) {
    next(err);
  }
});

router.post('/movimientos/:movimiento_enc_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);

  try {
    const items = await knex('MovimientosStockDet').insert(values, '*');

    res.status(200).json(camelizeKeys(items));
  } catch (err) {
    next(err);
  }
});

export default router;
