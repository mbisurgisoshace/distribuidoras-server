import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const estadosMovimiento = await knex('MovimientosEstado').select('*');
		res.status(200).json(camelizeKeys(estadosMovimiento));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const estadoMovimiento = (await knex('MovimientosEstado').insert(values, '*'))[0];
		res.status(200).json(estadoMovimiento);
	} catch (err) {
		next(err);
	}
});

router.put('/tipo_movimiento_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req:express.Request<any>, res, next) => {
	const tipo_movimiento_id = req.params.tipo_movimiento_id;
	const values = req.body;

	try {
		const estadoMovimiento = await knex('MovimientosEstado')
			.where({ EstadoMovimientoID: tipo_movimiento_id })
			.first();

		if (estadoMovimiento) {
			const updatedEstadoMovimiento = (await knex('MovimientosEstado')
				.where({ EstadoMovimientoID: tipo_movimiento_id })
				.update(values, '*'))[0];
			res.status(200).json(updatedEstadoMovimiento);
		} else {
			res.status(400).json({ error: `Movimiento Estado ID: ${tipo_movimiento_id} no existe.` });
		}
	} catch (err) {
		next(err);
	}
});

router.delete(
	'/tipo_movimiento_id',
	authHelpers.ensureAuthenticated,
	authHelpers.ensureIsUser,
	async (req:express.Request<any>, res, next) => {
		const tipo_movimiento_id = req.params.tipo_movimiento_id;

		try {
			const deletedEstadoMovimiento = await knex('MovimientosEstado')
				.where({ EstadoMovimientoID: tipo_movimiento_id })
				.delete();

			if (deletedEstadoMovimiento) {
				res.status(200).json(`Movimiento Estado ID: ${tipo_movimiento_id} eliminado satisfactoriamente`);
			} else {
				res.status(400).json({ error: `Movimiento Estado ID: ${tipo_movimiento_id} no existe.` });
			}
		} catch (err) {
			next(err);
		}
	}
);

export default router;
