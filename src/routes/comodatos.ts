//@ts-nocheck

import * as R from 'ramda';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';
import ComodatoService from '../services/ComodatoService';
import AuditoriaService from '../services/AuditoriaService';

const router = express.Router();

router.get(
  '/',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const comodatos = await knex('ComodatosEnc');
      await Promise.all(
        comodatos.map(async (m) => {
          const detalle = await knex('ComodatosDet').where({ ComodatoEncID: m.ComodatoEncID });
          camelizeKeys(detalle);
          m.items = camelizeKeys(detalle);
        })
      );
      res.status(200).json(camelizeKeys(comodatos));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:comodato_enc_id(\\d+)',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const comodato_enc_id = req.params.comodato_enc_id;

    try {
      const comodato = await knex('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
      const detalle = await knex('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
      comodato.items = camelizeKeys(detalle);

      res.status(200).json(camelizeKeys(comodato));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/vigentes',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (Req, res, next) => {
    try {
      const comodatos = await knex('ComodatosEnc')
        .select('ComodatosEnc.*', 'Clientes.RazonSocial')
        .innerJoin('Clientes', 'Clientes.ClienteID', 'ComodatosEnc.ClienteID')
        .where({ Vigente: true });

      res.status(200).json(camelizeKeys(comodatos));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/cliente/:cliente_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
      const comodatos = await knex('ComodatosEnc').where({ ClienteID: cliente_id, vigente: true });

      for (let i = 0; i < comodatos.length; i++) {
        let comodato = comodatos[i];
        const detalle = await knex('ComodatosDet')
          .innerJoin('Envases', 'ComodatosDet.EnvaseID', 'Envases.EnvaseID')
          .where({ ComodatoEncID: comodato.ComodatoEncID });
        comodato.items = camelizeKeys(detalle);
      }

      // if (comodato) {
      //   const detalle = await knex('ComodatosDet').where({ComodatoEncID: comodato.ComodatoEncID});
      //   comodato.items = camelizeKeys(detalle);
      //   res.status(200).json(camelizeKeys(comodato));
      // } else {
      //   res.status(200).json(null);
      // }

      res.status(200).json(camelizeKeys(comodatos));
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
    const values: any = formatKeys(req.body);

    try {
      const comodato = (await knex('ComodatosEnc').insert(values, '*'))[0];
      AuditoriaService.log(
        'comodatos',
        comodato.ComodatoEncID,
        JSON.stringify(comodato),
        'insert',
        req.user.username
      );
      res.status(200).json(camelizeKeys(comodato));
    } catch (err) {
      console.log('err', err);
      next(err);
    }
  }
);

router.post(
  '/:comodato_enc_id(\\d+)',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const values: any = formatKeys(req.body);
    const comodato_enc_id = req.params.comodato_enc_id;

    try {
      const comodato = await knex('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
      const items = await knex('ComodatosDet').insert(values, '*');

      if (comodato.Tipo !== 'renovacion') {
        await ComodatoService.insertarMovimientos(camelizeKeys(comodato), camelizeKeys(items));
      }

      res.status(200).json(camelizeKeys(items));
    } catch (err) {
      console.log('err', err);
      next(err);
    }
  }
);

router.post(
  '/:comodato_enc_id/renovar',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const comodato_enc_id = req.params.comodato_enc_id;
    const comodatoEnc: any = R.omit(['items'], formatKeys(req.body));
    const comodatoDet: any = R.pick(['items'], formatKeys(req.body));

    try {
      const comodato = await knex('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
      const detalle = await knex('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
      comodato.items = camelizeKeys(detalle);

      const newComodato = await ComodatoService.insertarComodato(
        comodatoEnc,
        formatKeys(comodatoDet.items)
      );
      //await ComodatoService.insertarMovimientos(camelizeKeys(newComodato), camelizeKeys(newComodato.items), camelizeKeys(comodato.items));
      await knex('ComodatosEnc')
        .update({ Vigente: false, Renovado: true, NroRenovacion: newComodato.NroComprobante })
        .where({ ComodatoEncID: comodato_enc_id });

      res.status(200).json(camelizeKeys(newComodato));
    } catch (err) {
      console.log('err', err);
      next(err);
    }
  }
);

router.put(
  '/renovar',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const values: any = req.body;
      for (let i = 0; i < values.length; i++) {
        let comodato = values[i];
        let comodatoId = comodato.comodato_enc_id;
        comodato = R.omit(['comodato_enc_id', 'items'], comodato);
        await knex('ComodatosEnc')
          .update({
            ClienteID: comodato.cliente_id,
            Fecha: comodato.fecha,
            NroComprobante: comodato.nro_comprobante,
            Monto: comodato.monto,
            FechaVencimiento: comodato.fecha_vencimiento,
            FechaRenovacion: comodato.fecha_renovacion,
            Vigente: comodato.vigente,
            Renovado: comodato.renovado,
            NroRenovacion: comodato.nro_renovacion,
            Observaciones: comodato.observaciones,
            ChoferID: comodato.chofer_id,
            Tipo: comodato.tipo,
          })
          .where({ ComodatoEncID: comodatoId });
      }

      res.status(200).json('Ok');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/gestion',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const values: any = req.body;

      const gestion = (await knex('ComodatosGestion').insert(values, '*'))[0];
      res.status(200).json(camelizeKeys(gestion));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
