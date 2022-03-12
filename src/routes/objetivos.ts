import * as express from 'express';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';
import knex from '../db/connection';
import AuditoriaService from '../services/AuditoriaService';

const router = express.Router();

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);
  console.log('values', values);
  try {
    for (let i = 0; i < values.length; i++) {
      const objetivo = values[i];
      await knex('ObjetivosZonaCanal').insert(objetivo, '*');
    }
    //AuditoriaService.log('objetivos', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
    res.status(200).json('Ok');
  } catch (err) {
    next(err);
  }
});

export default router;
