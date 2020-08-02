import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        const subzonas = await knex('ZonasSub').select('*');
        res.status(200).json(camelizeKeys(subzonas));
    } catch (err) {
        console.log('err', err);
        next(err);
    }
});

router.get('/:subzona_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const subzona_id = req.params.subzona_id;

    try {
        const subzona = await knex('ZonasSub').where({ SubZonaID: subzona_id }).first();
        res.status(200).json(subzona);
    } catch (err) {
        next(err);
    }
});

export default router;
