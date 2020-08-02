import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";

const router = express.Router();

router.get('/:hoja_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
        const cargas = await knex('CargasEnc').where({HojaRutaID: hoja_id});
        await Promise.all(cargas.map(async c => {
            const detalle = await knex('CargasDet').where({CargaEncID: c.CargaEncID});
            camelizeKeys(detalle);
            c.items = camelizeKeys(detalle);
        }));
        res.status(200).json(camelizeKeys(cargas));
    } catch (err) {
        next(err);
    }
});

export default router;
