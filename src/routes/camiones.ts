import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys } from '../utils/utils';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const camiones = await knex('Camiones').select('*');
		res.status(200).json(camelizeKeys(camiones));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const camion = (await knex('Camiones').insert(values, '*'))[0];
		res.status(200).json(camion);
	} catch (err) {
		next(err);
	}
});

router.put('/camion_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const camion_id = req.params.camion_id;
	const values = req.body;

	try {
		const camion = await knex('Camiones').where({ CamionID: camion_id }).first();

		if (camion) {
			const updatedCamion = (await knex('Camiones').where({ CamionID: camion_id }).update(values, '*'))[0];
			res.status(200).json(updatedCamion);
		} else {
			res.status(400).json({ error: `Camion ID: ${camion_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete('/camion_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const camion_id = req.params.camion_id;

	try {
		const deletedCamion = await knex('Camiones').where({ CamionID: camion_id }).delete();

		if (deletedCamion) {
			res.status(200).json(`Camion ID: ${camion_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Camion ID: ${camion_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
