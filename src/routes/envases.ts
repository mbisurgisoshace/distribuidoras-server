import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const envases = await knex('Envases').select('*');
		res.status(200).json(camelizeKeys(envases));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const envase = (await knex('Envases').insert(values, '*'))[0];
		res.status(200).json(envase);
	} catch (err) {
		next(err);
	}
});

router.put('/envase_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const envase_id = req.params.envase_id;
	const values = req.body;

	try {
		const envase = await knex('Envases').where({ EnvaseID: envase_id }).first();

		if (envase) {
			const updatedEnvase = (await knex('Envases').where({ EnvaseID: envase_id }).update(values, '*'))[0];
			res.status(200).json(updatedEnvase);
		} else {
			res.status(400).json({ error: `Envase ID: ${envase_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete('/envase_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const envase_id = req.params.envase_id;

	try {
		const deletedEnvase = await knex('Envases').where({ EnvaseID: envase_id }).delete();

		if (deletedEnvase) {
			res.status(200).json(`Envase ID: ${envase_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Envase ID: ${envase_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
