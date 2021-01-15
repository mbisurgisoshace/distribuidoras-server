import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";
import AuditoriaService from "../services/AuditoriaService";

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        const clientes = await knex('Clientes').select('*');
        res.status(200).json(camelizeKeys(clientes));
    } catch (err) {
        next(err);
    }
});

router.get('/:cliente_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
        const cliente = await knex('Clientes').where({ClienteID: cliente_id}).first();
        res.status(200).json(camelizeKeys(cliente));
    } catch (err) {
        next(err);
    }
});

router.get('/canal/:canal_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const canal_id = req.params.canal_id;

  try {
    const clientes = await knex('Clientes').where({CanalID: canal_id});
    res.status(200).json(camelizeKeys(clientes));
  } catch (err) {
    next(err);
  }
});

router.get('/last', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        const lastCodigo = (await knex('Clientes').first().orderBy('ClienteID', 'desc').pluck('ClienteID'))[0] + 1;
        res.status(200).json(lastCodigo);
    } catch (err) {
        next(err);
    }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values: any = formatKeys(req.body, 'cliente_id');
    values.Estado = true;

    try {
        const cliente = (await knex('Clientes').insert(values, '*'))[0];
        AuditoriaService.log('clientes', cliente.ClienteID, JSON.stringify(cliente), 'insert', req.user.username);
        res.status(200).json(camelizeKeys(cliente));
    } catch (err) {
        console.log('err', err);
        next(err);
    }
});

router.put('/:cliente_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const cliente_id = req.params.cliente_id;
    const values: any = formatKeys(req.body, 'cliente_id');

    try {
        const cliente = await knex('Clientes').where({ClienteID: cliente_id}).first();

        if (cliente) {
            const updatedCliente = (await knex('Clientes').where({ClienteID: cliente_id}).update(values, '*'))[0];
            AuditoriaService.log('clientes', updatedCliente.ClienteID, JSON.stringify(updatedCliente), 'update', req.user.username);
            res.status(200).json(camelizeKeys(updatedCliente));
        } else {
            res.status(404).json({error: `Cliente ID: ${cliente_id} no existe.`});
        }
    } catch (err) {
        next(err);
    }
});

router.delete('/:cliente_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
        const deletedCliente = await knex('Clientes').where({ClienteID: cliente_id}).delete();

        if (deletedCliente) {
            AuditoriaService.log('clientes', deletedCliente.ClienteID, JSON.stringify(deletedCliente), 'delete', req.user.username);
            res.status(200).json(`Cliente ID: ${cliente_id} eliminado satisfactoriamente`);
        } else {
            res.status(404).json({error: `Cliente ID: ${cliente_id} no existe.`});
        }
    } catch (err) {
        next(err);
    }
});

router.get('/:cliente_id/last', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
    	const lastPedidoId = await knex('MovimientosEnc')
			.where({ClienteID: cliente_id})
			.orderBy('fecha', 'desc')
			.first()
			.pluck('MovimientoEncID');

		if (lastPedidoId[0]) {
			let items = await knex('MovimientosEnc')
				.innerJoin('MovimientosDet', 'MovimientosEnc.MovimientoEncID', 'MovimientosDet.MovimientoEncID')
				.innerJoin('Envases', 'MovimientosDet.EnvaseID', 'Envases.EnvaseID')
				.where('MovimientosEnc.MovimientoEncID', lastPedidoId[0])
				.select('EnvaseCodigo', 'EnvaseNombre', 'Cantidad', 'Monto');

			if (items && items.length > 0) {
				items = items.map(i => {
					let precio = i.Monto / i.Cantidad;
					return {
						...i,
						precio
					}
				});
			}

			let lastPedido = {
				pedido_id: lastPedidoId[0],
				items: camelizeKeys(items)
			};

			res.status(200).json(lastPedido);
		} else {
			res.status(404).json({error: 'El cliente no tiene pedidos.'});
		}
    } catch (err) {
        next(err);
    }
});

router.get('/:cliente_id/comodato', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
  const cliente_id = req.params.cliente_id;

  try {
    const comodato = await knex('ComodatosEnc')
      .where({ClienteID: cliente_id, Vigente: true})
      .first();

    if (comodato) {
      let items = await knex('ComodatosDet')
        .innerJoin('Envases', 'ComodatosDet.EnvaseID', 'Envases.EnvaseID')
        .where({ComodatoEncID: comodato.ComodatoEncID})
        .select('EnvaseCodigo', 'EnvaseNombre', 'Cantidad', 'Monto');

      let lastComodato = {
        fecha: comodato.Fecha,
        comprobante: comodato.NroComprobante,
        items: camelizeKeys(items)
      }

      res.status(200).json(lastComodato);
    } else {
      res.status(404).json({error: 'El cliente no tiene comodatos.'});
    }
  } catch (err) {
    next(err);
  }
});

export default router;
