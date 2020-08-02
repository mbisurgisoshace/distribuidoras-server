import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const canales = await knex('Canales').select('*');
		res.status(200).json(camelizeKeys(canales));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const canal = (await knex('Canales').insert(values, '*'))[0];
		res.status(200).json(canal);
	} catch (err) {
		next(err);
	}
});

router.put('/:canal_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const canal_id = req.params.canal_id;
	const values = req.body;

	try {
		const canal = await knex('Canales').where({ CanalID: canal_id }).first();

		if (canal) {
			const updatedCanal = (await knex('Canales').where({ CanalID: canal_id }).update(values, '*'))[0];
			res.status(200).json(updatedCanal);
		} else {
			res.status(400).json({ error: `Canal ID: ${canal_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete('/:canal_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const canal_id = req.params.canal_id;

	try {
		const deletedCanal = await knex('Canales').where({ CanalID: canal_id }).delete();

		if (deletedCanal) {
			res.status(200).json(`Canal ID: ${canal_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Canal ID: ${canal_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
