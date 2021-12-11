import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys } from '../utils/utils';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const tiposMovimiento = await knex('MovimientosTipo').select('*');
		res.status(200).json(camelizeKeys(tiposMovimiento));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const tipoMovimiento = (await knex('MovimientosTipo').insert(values, '*'))[0];
		res.status(200).json(tipoMovimiento);
	} catch (err) {
		next(err);
	}
});

router.put('/:tipo_movimiento_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const tipo_movimiento_id = req.params.tipo_movimiento_id;
	const values = req.body;

	try {
		const tipoMovimiento = await knex('MovimientosTipo').where({ TipoMovimientoID: tipo_movimiento_id }).first();

		if (tipoMovimiento) {
			const updatedTipoMovimiento = (await knex('MovimientosTipo')
				.where({ TipoMovimientoID: tipo_movimiento_id })
				.update(values, '*'))[0];
			res.status(200).json(updatedTipoMovimiento);
		} else {
			res.status(400).json({ error: `Movimiento Tipo ID: ${tipo_movimiento_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete(
	'/:tipo_movimiento_id',
	authHelpers.ensureAuthenticated,
	authHelpers.ensureIsUser,
	async (req, res, next) => {
		const tipo_movimiento_id = req.params.tipo_movimiento_id;

		try {
			const deletedTipoMovimiento = await knex('MovimientosTipo')
				.where({ TipoMovimientoID: tipo_movimiento_id })
				.delete();

			if (deletedTipoMovimiento) {
				res.status(200).json(`Movimiento Tipo ID: ${tipo_movimiento_id} eliminado satisfactoriamente`);
			} else {
				res.status(400).json({ error: `Movimiento Tipo ID: ${tipo_movimiento_id} no existe.` });
			}
		} catch (err) {
			next(err);
		}
	}
);

export default router;
