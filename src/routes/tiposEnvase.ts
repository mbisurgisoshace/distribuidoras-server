import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const tiposEnvase = await knex('EnvasesTipo').select('*');
		res.status(200).json(tiposEnvase);
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const tipoEnvase = (await knex('EnvasesTipo').insert(values, '*'))[0];
		res.status(200).json(tipoEnvase);
	} catch (err) {
		next(err);
	}
});

router.put('/:tipo_envase_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const tipo_envase_id = req.params.tipo_envase_id;
	const values = req.body;

	try {
		const tipoEnvase = await knex('EnvasesTipo').where({ TipoEnvaseID: tipo_envase_id }).first();

		if (tipoEnvase) {
			const updatedTipoEnvase = (await knex('EnvasesTipo')
				.where({ TipoEnvaseID: tipo_envase_id })
				.update(values, '*'))[0];
			res.status(200).json(updatedTipoEnvase);
		} else {
			res.status(400).json({ error: `Envase Tipo ID: ${tipo_envase_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete(
	'/:tipo_envase_id',
	authHelpers.ensureAuthenticated,
	authHelpers.ensureIsUser,
	async (req, res, next) => {
		const tipo_envase_id = req.params.tipo_envase_id;

		try {
			const deletedTipoEnvase = await knex('EnvasesTipo')
				.where({ TipoEnvaseID: tipo_envase_id })
				.delete();

			if (deletedTipoEnvase) {
				res.status(200).json(`Envase Tipo ID: ${tipo_envase_id} eliminado satisfactoriamente`);
			} else {
				res.status(400).json({ error: `Envase Tipo ID: ${tipo_envase_id} no existe.` });
			}
		} catch (err) {
			next(err);
		}
	}
);

export default router;
