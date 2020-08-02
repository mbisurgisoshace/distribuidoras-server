import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        const listasPrecio = await knex('ListasPrecio').select('*');
        res.status(200).json(camelizeKeys(listasPrecio));
    } catch (err) {
        next(err);
    }
});

router.get('/:precio_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const precio_id = req.params.precio_id;

    try {
        const precios = await knex('ListasPrecioDet').select('*').where({ListaPrecioID: precio_id});
        res.status(200).json(camelizeKeys(precios));
    } catch (err) {
        next(err);
    }
});

export default router;
