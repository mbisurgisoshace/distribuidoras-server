//@ts-nocheck

import * as R from 'ramda';
import * as moment from 'moment';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';
import AuditoriaService from '../services/AuditoriaService';

const router = express.Router();

router.get(
  '/',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      let fecha = req.query.fecha;
      if (!fecha) fecha = moment().format('YYYY-MM-DD');
      //const today = moment().format('YYYY-MM-DD');

      const hojas = await knex('HojasRuta')
        .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
        .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
        .where({ Fecha: fecha });
      res.status(200).json(camelizeKeys(hojas));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:hoja_id(\\d+)',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
      const hoja = await knex('HojasRuta')
        .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
        .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
        .where({ HojaRutaID: hoja_id })
        .first();
      res.status(200).json(camelizeKeys(hoja));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/fecha/:fecha',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const fecha = req.params.fecha;

    try {
      const hojas = await knex('HojasRuta').select('*').where({ Fecha: fecha });
      res.status(200).json(camelizeKeys(hojas));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/estado/:estado',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const estado = req.params.estado;

    try {
      const hojas = await knex('HojasRuta')
        .select('HojasRuta.*', 'Choferes.Nombre', 'Choferes.Apellido')
        .where({ Estado: estado })
        .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID');
      res.status(200).json(camelizeKeys(hojas));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const values = formatKeys(req.body);

    try {
      const hoja = (await knex('HojasRuta').insert(values, '*'))[0];
      AuditoriaService.log(
        'hojas de ruta',
        hoja.HojaRutaID,
        JSON.stringify(hoja),
        'insert',
        req.user.username
      );
      res.status(200).json(camelizeKeys(hoja));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/abrir',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const values = formatKeys(req.body.hojaRuta);
    const clientes = req.body.clientes;

    try {
      await knex.transaction(async (trx) => {
        const hoja = (
          await trx('HojasRuta').insert(
            {
              ...values,
              KmFinal: 0,
              VentaContado: 0,
              VentaCtacte: 0,
              VentaTarjeta: 0,
              GastoCombustible: 0,
              GastoViatico: 0,
              GastoOtro: 0,
              Cobranza: 0,
              Cheques: 0,
              Efectivo: 0,
            },
            '*'
          )
        )[0];
        const HojaRutaID = hoja.HojaRutaID;

        await Promise.all(
          clientes.map(async (cliente) => {
            const movimientoEnc = {
              Fecha: hoja.Fecha,
              ClienteID: cliente.cliente_id,
              HojaRutaID,
              CondicionVentaID: cliente.condicion_venta_id,
              TipoMovimientoID: 1,
              EstadoMovimientoID: 1,
            };
            await trx('MovimientosEnc').insert(values);
          })
        );
      });

      AuditoriaService.log(
        'hojas de ruta',
        hoja.HojaRutaID,
        JSON.stringify(hoja),
        'insert',
        req.user.username
      );
      res.status(200).json(camelizeKeys(hoja));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:hoja_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const hoja_id = req.params.hoja_id;
    let values: any = formatKeys(req.body, 'hoja_ruta_id');
    values = R.omit(['apellido', 'nombre'], values);

    try {
      const hoja = await knex('HojasRuta').where({ HojaRutaID: hoja_id }).first();

      if (hoja) {
        const updatedHoja = (
          await knex('HojasRuta').where({ HojaRutaID: hoja_id }).update(values, '*')
        )[0];
        AuditoriaService.log(
          'hojas de ruta',
          updatedHoja.HojaRutaID,
          JSON.stringify(updatedHoja),
          'update',
          req.user.username
        );
        res.status(200).json(camelizeKeys(updatedHoja));
      } else {
        res.status(400).json({ error: `Hoja Ruta ID: ${hoja_id} no existe.` });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:hoja_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
      const deletedHoja = await knex('HojasRuta').where({ HojaRutaID: hoja_id }).delete();

      if (deletedHoja) {
        res.status(200).json(`Hoja Ruta ID: ${hoja_id} eliminado satisfactoriamente`);
      } else {
        res.status(400).json({ error: `Hoja Ruta ID: ${hoja_id} no existe.` });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:hoja_id/movimientos',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const hoja_id = req.params.hoja_id;
    const values: any = formatKeys(req.body);

    try {
      const movimientos = await knex('MovimientosEnc').insert(values, '*');
      //AuditoriaService.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
      res.status(200).json(movimientos || {});
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/search',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const filters = req.body;

    try {
      let query = knex('HojasRuta')
        .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
        .leftOuterJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
        .orderBy('HojasRuta.HojaRutaID');

      if (filters.desde && filters.hasta) {
        const desde = moment(filters.desde, 'DD-MM-YYYY').format('YYYY-MM-DD');
        const hasta = moment(filters.hasta, 'DD-MM-YYYY').format('YYYY-MM-DD');
        query = query.andWhere(function () {
          this.andWhere('HojasRuta.Fecha', '>=', desde).andWhere('HojasRuta.Fecha', '<=', hasta);
        });
      }

      const hojas = (await query) || [];

      res.send(hojas);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
