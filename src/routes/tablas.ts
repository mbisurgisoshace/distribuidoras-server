import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

const TABLES_MAP = {
  zonas: 'Zonas',
  subzonas: 'ZonasSub',
  canales: 'Canales',
  subcanales: 'Subcanales',
  condicionesIva: 'CondicionesIva',
  condicionesVenta: 'CondicionesVenta',
  listasPrecio: 'ListasPrecio',
  tiposMovimiento: 'MovimientosTipo',
  estadosMovimiento: 'MovimientosEstado',
  motivos: 'Motivos',
  envases: 'Envases',
  choferes: 'Choferes',
};

const QUERY_TABLES = [
  'zonas',
  'subzonas',
  'canales',
  'subcanales',
  'condicionesIva',
  'condicionesVenta',
  'listasPrecio',
  'tiposMovimiento',
  'estadosMovimiento',
  'motivos',
  'envases',
  'choferes',
];

router.get(
  '/',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const tables = (req.query.tables as string).split(',') || QUERY_TABLES;

      const performQueries = tables.map((table) => ({
        key: table,
        table: TABLES_MAP[table],
      }));

      const queriesPromises = performQueries.map((query) => knex(query.table).select('*'));

      const promisesResult = await Promise.all(queriesPromises);

      const response = {};
      performQueries.forEach((query, idx) => {
        response[query.key] = camelizeKeys(promisesResult[idx]);
      });

      res.status(200).json(response);
    } catch (err) {
      console.log('err', err);
    }
  }
);

export default router;
