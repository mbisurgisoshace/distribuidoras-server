import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys} from "../utils/utils";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	try {
		const condicionesVenta = await knex('CondicionesVenta').select('*');
		res.status(200).json(camelizeKeys(condicionesVenta));
	} catch (err) {
		next(err);
	}
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
	const values = req.body;

	try {
		const condicionVenta = (await knex('CondicionesVenta').insert(values, '*'))[0];

		res.status(200).json(condicionVenta);
	} catch (err) {
		next(err);
	}
});

router.put(
	'/:condicion_venta_id',
	authHelpers.ensureAuthenticated,
	authHelpers.ensureIsUser,
	async (req, res, next) => {
		const condicion_venta_id = req.params.condicion_venta_id;
		const values = req.body;

		try {
			const condicionVenta = await knex('CondicionesVenta')
				.where({ CondicionVentaID: condicion_venta_id })
				.first();

			if (condicionVenta) {
				const updatedCondicionVenta = (await knex('CondicionesVenta')
					.where({ CondicionVentaID: condicion_venta_id })
					.update(values, '*'))[0];
				res.status(200).json(updatedCondicionVenta);
			} else {
				res.status(400).json({ error: `Condicion de Venta ID: ${condicion_venta_id} no existe.` });
			}
		} catch (err) {
			next(err);
		}
	}
);

router.delete(
	'/:condicion_venta_id',
	authHelpers.ensureAuthenticated,
	authHelpers.ensureIsUser,
	async (req, res, next) => {
		const condicion_venta_id = req.params.condicion_venta_id;

		try {
			const deletedCondicionVenta = await knex('CondicionesVenta')
				.where({ CondicionVentaID: condicion_venta_id })
				.delete();

			if (deletedCondicionVenta) {
				res.status(200).json(`Condicion de Venta ID: ${condicion_venta_id} eliminado satisfactoriamente`);
			} else {
				res.status(400).json({ error: `Condicion de Venta ID: ${condicion_venta_id} no existe.` });
			}
		} catch (err) {
			next(err);
		}
	}
);

export default router;
