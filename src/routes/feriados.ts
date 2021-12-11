import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const feriados = await knex('Feriados').select('*');
		res.status(200).json(camelizeKeys(feriados));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = formatKeys(req.body);

	try {
		const feriado = (await knex('Feriados').insert(values, '*'))[0];
		res.status(200).json(feriado);
	} catch (err) {
		next(err);
	}
});

router.put('/:feriado_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const feriado_id = req.params.feriado_id;
	const values = formatKeys(req.body, 'feriado_id');

	try {
		const feriado = await knex('Feriados').where({ FeriadoID: feriado_id }).first();

		if (feriado) {
			const updatedFeriado = (await knex('Feriados').where({ FeriadoID: feriado_id }).update(values, '*'))[0];
			res.status(200).json(updatedFeriado);
		} else {
			res.status(400).json({ error: `Feriado ID: ${feriado_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete('/:feriado_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const feriado_id = req.params.feriado_id;

	try {
		const deletedFeriado = await knex('Feriados').where({ FeriadoID: feriado_id }).delete();

		if (deletedFeriado) {
			res.status(200).json(`Feriado ID: ${feriado_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Feriado ID: ${feriado_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
