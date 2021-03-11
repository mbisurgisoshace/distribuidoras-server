import * as R from 'ramda';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";
import ComodatoService from '../services/ComodatoService';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  try {
    const comodatos = await knex('ComodatosEnc');
    await Promise.all(comodatos.map(async m => {
      const detalle = await knex('ComodatosDet').where({ComodatoEncID: m.ComodatoEncID});
      camelizeKeys(detalle);
      m.items = camelizeKeys(detalle);
    }));
    res.status(200).json(camelizeKeys(comodatos));
  } catch (err) {
    next(err);
  }
});

router.get('/:comodato_enc_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const comodato_enc_id = req.params.comodato_enc_id;

  try {
    const comodato = await knex('ComodatosEnc').where({ComodatoEncID: comodato_enc_id}).first();
    const detalle = await knex('ComodatosDet').where({ComodatoEncID: comodato.ComodatoEncID});
    comodato.items = camelizeKeys(detalle);

    res.status(200).json(camelizeKeys(comodato));
  } catch (err) {
    next(err);
  }
});

router.get('/vigentes', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (Req, res, next) => {
  try {
    const comodatos = await knex('ComodatosEnc')
      .select('ComodatosEnc.*', 'Clientes.RazonSocial')
      .innerJoin('Clientes', 'Clientes.ClienteID', 'ComodatosEnc.ClienteID')
      .where({Vigente: true});

    res.status(200).json(camelizeKeys(comodatos));
  } catch (err){
    next(err);
  }
});

router.get('/cliente/:cliente_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const cliente_id = req.params.cliente_id;

  try {
    const comodato = await knex('ComodatosEnc').where({ClienteID: cliente_id, vigente: true}).first();

    if (comodato) {
      const detalle = await knex('ComodatosDet').where({ComodatoEncID: comodato.ComodatoEncID});
      comodato.items = camelizeKeys(detalle);
      res.status(200).json(camelizeKeys(comodato));
    } else {
      res.status(200).json(null);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);

  try {
    const comodato = (await knex('ComodatosEnc').insert(values, '*'))[0];
    res.status(200).json(camelizeKeys(comodato));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.post('/:comodato_enc_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const values: any = formatKeys(req.body);
  const comodato_enc_id = req.params.comodato_enc_id;

  try {
    const comodato = await knex('ComodatosEnc').where({ComodatoEncID: comodato_enc_id}).first()
    const items = await knex('ComodatosDet').insert(values, '*');
    await ComodatoService.insertarMovimientos(camelizeKeys(comodato), camelizeKeys(items), []);
    res.status(200).json(camelizeKeys(items));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.post('/:comodato_enc_id/renovar', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const comodato_enc_id = req.params.comodato_enc_id;
  const comodatoEnc: any = R.omit(['items'], formatKeys(req.body));
  const comodatoDet: any = R.pick(['items'], formatKeys(req.body));

  try {
    const comodato = await knex('ComodatosEnc').where({ComodatoEncID: comodato_enc_id}).first();
    const detalle = await knex('ComodatosDet').where({ComodatoEncID: comodato.ComodatoEncID});
    comodato.items = camelizeKeys(detalle);

    const newComodato = await ComodatoService.insertarComodato(comodatoEnc, formatKeys(comodatoDet.items));
    await ComodatoService.insertarMovimientos(camelizeKeys(newComodato), camelizeKeys(newComodato.items), camelizeKeys(comodato.items));
    await knex('ComodatosEnc').update({Vigente: false, Renovado: true, NroRenovacion: newComodato.NroComprobante}).where({ComodatoEncID: comodato_enc_id});

    res.status(200).json(camelizeKeys(newComodato));
  } catch (err) {
    console.log('err', err);
    next(err);
  }
});

router.post('/gestion', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  try {
    const values: any = req.body;

    const gestion = (await knex('ComodatosGestion').insert(values, '*'))[0];
    res.status(200).json(camelizeKeys(gestion));
  } catch (err) {
    next(err);
  }
});

export default router;
