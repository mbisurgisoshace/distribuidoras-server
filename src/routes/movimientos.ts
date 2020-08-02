import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";

const router = express.Router();

router.get('/:hoja_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
        const movimientos = await knex('MovimientosEnc').where({HojaRutaID: hoja_id});
        await Promise.all(movimientos.map(async m => {
            const detalle = await knex('MovimientosDet').where({MovimientoEncID: m.MovimientoEncID});
            camelizeKeys(detalle);
            m.items = camelizeKeys(detalle);
        }));
        res.status(200).json(camelizeKeys(movimientos));
    } catch (err) {
        next(err);
    }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values: any = formatKeys(req.body);

    try {
        const movimiento = (await knex('MovimientosEnc').insert(values, '*'))[0];
        res.status(200).json(camelizeKeys(movimiento));
    } catch (err) {
        console.log('err', err);
        next(err);
    }
})

router.post('/:movimiento_enc_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values: any = formatKeys(req.body);

    try {
        const items = await knex('MovimientosDet').insert(values, '*');
        res.status(200).json(camelizeKeys(items));
    } catch (err) {
        console.log('err', err);
        next(err);
    }
})

export default router;
