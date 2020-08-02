import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const estadosEnvase = await knex('EnvasesEstado').select('*');
		res.status(200).json(estadosEnvase);
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const estadoEnvase = (await knex('EnvasesEstado').insert(values, '*'))[0];
		res.status(200).json(estadoEnvase);
	} catch (err) {
		next(err);
	}
});

router.put('/estado_envase_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const estado_envase_id = req.params.estado_envase_id;
	const values = req.body;

	try {
		const estadoEnvase = await knex('EnvasesEstado')
			.where({ EstadoEnvaseID: estado_envase_id })
			.first();

		if (estadoEnvase) {
			const updatedEstadoEnvase = (await knex('EnvasesEstado')
				.where({ EstadoEnvaseID: estado_envase_id })
				.update(values, '*'))[0];
			res.status(200).json(updatedEstadoEnvase);
		} else {
			res.status(400).json({ error: `Envase Estado ID: ${estado_envase_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete(
	'/estado_envase_id',
	authHelpers.ensureAuthenticated,
	authHelpers.ensureIsUser,
	async (req, res, next) => {
		const estado_envase_id = req.params.estado_envase_id;

		try {
			const deletedEstadoEnvase = await knex('EnvasesEstado')
				.where({ EstadoEnvaseID: estado_envase_id })
				.delete();

			if (deletedEstadoEnvase) {
				res.status(200).json(`Envase Estado ID: ${estado_envase_id} eliminado satisfactoriamente`);
			} else {
				res.status(400).json({ error: `Envase Estado ID: ${estado_envase_id} no existe.` });
			}
		} catch (err) {
			next(err);
		}
	}
);

export default router;
