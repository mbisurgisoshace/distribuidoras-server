import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const zonas = await knex('Zonas').select('*');
		res.status(200).json(camelizeKeys(zonas));
	} catch (err) {
		console.log('err', err);
		next(err);
	}
});

router.get('/:zona_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const zona_id = req.params.zona_id;

	try {
		const zona = await knex('Zonas').where({ ZonaID: zona_id }).first();
		res.status(200).json(zona);
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const zona = (await knex('Zonas').insert(values, '*'))[0];
		res.status(200).json(zona);
	} catch (err) {
		next(err);
	}
});

router.put('/:zona_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const zona_id = req.params.zona_id;
	const values = req.body;

	try {
		const zona = await knex('Zonas').where({ ZonaID: zona_id }).first();

		if (zona) {
			const updatedZona = (await knex('Zonas').where({ ZonaID: zona_id }).update(values, '*'))[0];
			res.status(200).json(updatedZona);
		} else {
			res.status(400).json({ error: `Zona ID: ${zona_id} no existe.` });
		}
	} catch (err) {
		console.log('err', err);
		next(err);
	}
});

router.delete('/:zona_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const zona_id = req.params.zona_id;

	try {
		const deletedZona = await knex('Zonas').where({ ZonaID: zona_id }).delete();

		if (deletedZona) {
			res.status(200).json(`Zona ID: ${zona_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Zona ID: ${zona_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
