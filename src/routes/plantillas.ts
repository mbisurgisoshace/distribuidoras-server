import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys } from '../utils/utils';

const router = express.Router();

router.get(
  '/:cliente_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;
    try {
      const plantillas = await knex('Plantillas').select('*').where({ ClienteID: cliente_id });
      res.status(200).json(camelizeKeys(plantillas));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:cliente_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;
    const dias = (req.body as string[]).map((dia) => ({ DiaSemana: dia, ClienteID: cliente_id }));
    try {
      await knex('Plantillas').delete().where({ ClienteID: cliente_id });
      await knex('Plantillas').insert(dias);
      res.status(200).json('Ok');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
