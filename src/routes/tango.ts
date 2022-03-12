import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";
import TangoService from '../services/TangoService';
import RemitoService from '../services/RemitoService';

const router = express.Router();

router.get('/clientes', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  try {
    const clientes = await knex('Clientes').where({Sincronizado: 0});
    await TangoService.syncClientes(clientes);
    res.status(200).json(camelizeKeys(clientes));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.get('/remitos', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  try {
    const remitosCrm = await knex('Remitos').where({Sincronizado: 0});
    console.log('remitosCrm', remitosCrm);
    const formattedRemitos = await RemitoService.generarRemitosCrm(remitosCrm);
    await TangoService.syncRemitos(formattedRemitos);
    res.status(200).json(camelizeKeys(formattedRemitos));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

export default router;
