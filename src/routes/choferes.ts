import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys } from '../utils/utils';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const choferes = await knex('Choferes').select('*');
		res.status(200).json(camelizeKeys(choferes));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const chofer = (await knex('Choferes').insert(values, '*'))[0];
		res.status(200).json(chofer);
	} catch (err) {
		next(err);
	}
});

router.put('/chofer_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const chofer_id = req.params.chofer_id;
	const values = req.body;

	try {
		const chofer = await knex('Choferes').where({ ChoferID: chofer_id }).first();

		if (chofer) {
			const updatedChofer = (await knex('Choferes').where({ ChoferID: chofer_id }).update(values, '*'))[0];
			res.status(200).json(updatedChofer);
		} else {
			res.status(400).json({ error: `Chofer ID: ${chofer_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete('/chofer_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const chofer_id = req.params.chofer_id;

	try {
		const deletedChofer = await knex('Choferes').where({ ChoferID: chofer_id }).delete();

		if (deletedChofer) {
			res.status(200).json(`Chofer ID: ${chofer_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Chofer ID: ${chofer_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
