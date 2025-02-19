import * as moment from 'moment';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys } from '../utils/utils';

const router = express.Router();

router.get('/analyzing', async (req, res, next) => {
  try {
    const data = await knex('viewVentas');
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/recuperados',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const startActualDate = moment().startOf('month').format('YYYY-MM-DD');
      const endActualDate = moment().endOf('month').format('YYYY-MM-DD');

      const startAnteriorDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      const endAnteriorDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

      const clientesMesActual = await knex('MovimientosEnc')
        .where({ EstadoMovimientoID: 3 })
        .whereBetween('Fecha', [startActualDate, endActualDate])
        .pluck('ClienteID')
        .distinct();

      const clientesMesAnterior = await knex('MovimientosEnc')
        .where({ EstadoMovimientoID: 3 })
        .whereBetween('Fecha', [startAnteriorDate, endAnteriorDate])
        .pluck('ClienteID')
        .distinct();

      const clientesHistorico = await knex('MovimientosEnc')
        .where({ EstadoMovimientoID: 3 })
        .whereNotBetween('Fecha', [startActualDate, endActualDate])
        .pluck('ClienteID')
        .distinct();

      const recuperadosIds = clientesMesActual.filter((c) => !clientesMesAnterior.includes(c));
      const nuevosIds = recuperadosIds.filter((c) => !clientesHistorico.includes(c));

      const recuperados = await knex('Clientes')
        .select(
          'Clientes.ClienteID as Id',
          'Clientes.RazonSocial as Razon Social',
          'Clientes.Calle as Calle',
          'Clientes.Altura as Altura',
          'Clientes.FechaUltimaCompra as Ultima Compra',
          'Canales.CanalNombre as Canal',
          'Zonas.ZonaNombre as Zona'
        )
        .whereIn('ClienteID', recuperadosIds)
        .innerJoin('Canales', 'Canales.CanalID', 'Clientes.CanalID')
        .innerJoin('ZonasSub', 'ZonasSub.SubZonaID', 'Clientes.ZonaSubID')
        .innerJoin('Zonas', 'Zonas.ZonaID', 'ZonasSub.ZonaID');

      const clientes = recuperados.map((c) => {
        return {
          ...c,
          Condicion: nuevosIds.includes(c.Id) ? 'nuevo' : 'recuperado',
        };
      });

      res.status(200).json(clientes);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/comodatos_movimientos',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const movimientos = await knex('ComodatosMovimientos')
        .select(
          'Clientes.ClienteID as Cliente Id',
          'Clientes.RazonSocial as Razon Social',
          'ComodatosMovimientos.fecha as Fecha',
          'ComodatosMovimientos.nro_comprobante as Comprobante',
          'Envases.EnvaseNombre as Envase',
          'ComodatosMovimientos.cantidad as Cantidad'
        )
        .innerJoin('Clientes', 'Clientes.ClienteID', 'ComodatosMovimientos.cliente_id')
        .innerJoin('Envases', 'Envases.EnvaseID', 'ComodatosMovimientos.envase_id');

      res.status(200).json(movimientos);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
