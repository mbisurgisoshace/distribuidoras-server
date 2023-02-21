import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

router.get(
  '/:hoja_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
      const cargas = await knex('CargasEnc').where({ HojaRutaID: hoja_id });
      await Promise.all(
        cargas.map(async (c) => {
          const detalle = await knex('CargasDet').where({ CargaEncID: c.CargaEncID });
          camelizeKeys(detalle);
          c.items = camelizeKeys(detalle);
        })
      );
      res.status(200).json(camelizeKeys(cargas));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:hoja_id/:tipo_carga_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const hoja_id = req.params.hoja_id;
    const tipo_carga_id = req.params.tipo_carga_id;

    try {
      const carga = await knex('CargasEnc')
        .where({ HojaRutaID: hoja_id, CargaTipoID: tipo_carga_id })
        .first();

      if (carga) {
        const detalle = await knex('CargasDet').where({ CargaEncID: carga.CargaEncID });
        const items = camelizeKeys(detalle);

        return res.status(200).json(
          camelizeKeys({
            ...carga,
            items,
          })
        );
      }

      res.status(200).json(null);
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
    try {
      const cargaEnc = formatKeys(req.body, 'items');
      const cargaDet: any = formatKeys(req.body.items);

      let newCarga;
      const items = [];

      await knex.transaction(async (trx) => {
        newCarga = (await trx('CargasEnc').insert(cargaEnc, '*'))[0];
        console.log(newCarga);

        for (let i = 0; i < cargaDet.length; i++) {
          let detalle = cargaDet[i];
          detalle.cargaEncId = newCarga.CargaEncID;
          console.log(detalle);
          const newDetalle = await trx('CargasDet').insert(detalle, '*');
          items.push(camelizeKeys(newDetalle));
        }
      });

      res.status(200).json(
        camelizeKeys({
          ...newCarga,
          items,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:carga_enc_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const carga_enc_id = req.params.carga_enc_id;

    try {
      const cargaEnc = formatKeys(req.body, 'items');
      const cargaDet: any = formatKeys(req.body.items);

      const items = [];
      console.log(cargaEnc);
      console.log(cargaDet);
      await knex.transaction(async (trx) => {
        await trx('CargasDet').delete().where({ CargaEncID: carga_enc_id });

        for (let i = 0; i < cargaDet.length; i++) {
          let detalle = cargaDet[i];
          delete detalle.cargadetid;
          delete detalle.cargaencid;
          console.log(detalle);
          detalle.cargaEncId = carga_enc_id;
          const updateDetalle = await trx('CargasDet').insert(detalle, '*');
          items.push(camelizeKeys(updateDetalle));
        }
      });

      res.status(200).json(
        camelizeKeys({
          ...cargaEnc,
          items,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
