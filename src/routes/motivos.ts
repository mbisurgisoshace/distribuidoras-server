import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const motivos = await knex('Motivos').select('*');
		res.status(200).json(motivos);
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const motivo = (await knex('Motivos').insert(values, '*'))[0];
		res.status(200).json(motivo);
	} catch (err) {
		next(err);
	}
});

router.put('/:motivo_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const motivo_id = req.params.motivo_id;
	const values = req.body;

	try {
		const motivo = await knex('Motivos').where({ MotivoID: motivo_id }).first();

		if (motivo) {
			const updatedMotivo = (await knex('Motivos').where({ MotivoID: motivo_id }).update(values, '*'))[0];
			res.status(200).json(updatedMotivo);
		} else {
			res.status(400).json({ error: `Motivo ID: ${motivo_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete('/:motivo_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const motivo_id = req.params.motivo_id;

	try {
		const deletedMotivo = await knex('Motivos').where({ MotivoID: motivo_id }).delete();

		if (deletedMotivo) {
			res.status(200).json(`Motivo ID: ${motivo_id} eliminado satisfactoriamente`);
		} else {
			res.status(400).json({ error: `Motivo ID: ${motivo_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

export default router;
