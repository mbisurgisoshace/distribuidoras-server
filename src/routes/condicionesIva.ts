import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        let condicionesIva = await knex('CondicionesIva').select('*');
		res.status(200).json(camelizeKeys(condicionesIva));
    } catch (err) {
        next(err);
    }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values = req.body;

    try {
        const condicionIva = (await knex('CondicionesIva').insert(values, '*'))[0];
        res.status(200).json(condicionIva);
    } catch (err) {
        next(err);
    }
});

router.put('/:condicion_iva_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const condicion_iva_id = req.params.condicion_iva_id;
    const values = req.body;

    try {
        const condicionIva = await knex('CondicionesIva').where({CondicionIvaID: condicion_iva_id}).first();

        if (condicionIva) {
            const updatedCondicionIva = (await knex('CondicionesIva')
                .where({CondicionIvaID: condicion_iva_id})
                .update(values, '*'))[0];
            res.status(200).json(updatedCondicionIva);
        } else {
            res.status(400).json({error: `Condicion de Iva ID: ${condicion_iva_id} no existe.`});
        }
    } catch (err) {
        next(err);
    }
});

router.delete(
    '/:condicion_iva_id',
    authHelpers.ensureAuthenticated,
    authHelpers.ensureIsUser,
    async (req, res, next) => {
        const condicion_iva_id = req.params.condicion_iva_id;

        try {
            const deletedCondicionIva = await knex('CondicionesIva')
                .where({CondicionIvaID: condicion_iva_id})
                .delete();

            if (deletedCondicionIva) {
                res.status(200).json(`Condicion de Iva ID: ${condicion_iva_id} eliminado satisfactoriamente`);
            } else {
                res.status(400).json({error: `Condicion de Iva ID: ${condicion_iva_id} no existe.`});
            }
        } catch (err) {
            next(err);
        }
    }
);

export default router;
