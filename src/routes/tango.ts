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

router.post('/pendiente_facturacion', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  //router.post('/pendiente-facturacion', async (req, res, next) => {
  try {
    const {desde, hasta} = req.body;

    const envases = await knex('Envases')
      .select('*')
      .whereIn('TipoEnvaseID', [1, 2]);

    const ventaCrm: any[] = await knex('viewVentas')
      .select('*')
      .whereBetween('Fecha', [desde, hasta]);

    const ventaTango: any[] = await TangoService.getVentaFacturada(desde, hasta);
    const remitoPendienteTango: any[] = await TangoService.getRemitosPendientes(desde, hasta);
    
    const ventasTotales = [];

    envases.forEach(envase => {
      const ventasEnvaseCrm = ventaCrm.filter(venta => venta.EnvaseID === envase.EnvaseID);
      const ventasEnvaseTango = ventaTango.filter(venta => venta.COD_ARTICU == envase.ID_ARTICULO_TANGO);
      const remitosPendientesEnvase = remitoPendienteTango.filter(remito => remito.COD_ARTICU == envase.ID_ARTICULO_TANGO);
      const cantidadCrm = ventasEnvaseCrm.reduce((acc, curr) => {
        return acc + curr.Cantidad;
      }, 0);

      const cantidadTango = ventasEnvaseTango.reduce((acc, curr) => {
        return acc + curr.CANTIDAD;
      }, 0);

      const cantidadPendiente = remitosPendientesEnvase.reduce((acc, curr) => {
        return acc + curr.CANT_PEND;
      }, 0);

      ventasTotales.push({
        envaseId: envase.EnvaseID,
        envaseNombre: envase.EnvaseNombre,
        cantidadCrm: cantidadCrm,
        kilosCrm: cantidadCrm * envase.Kilos,
        cantidadFacturada: cantidadTango,
        kilosFacturados: cantidadTango * envase.Kilos,
        cantidadPendienteRemitir: cantidadPendiente,
        kilosPendienteRemitir: cantidadPendiente * envase.Kilos,
        cantidadPendienteFacturar: cantidadCrm - cantidadTango - cantidadPendiente,
        kilosPendienteFacturar: (cantidadCrm - cantidadTango - cantidadPendiente) * envase.Kilos
      })
    });

      res.status(200).json(ventasTotales)
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

export default router;
