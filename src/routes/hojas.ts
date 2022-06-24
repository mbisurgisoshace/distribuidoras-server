//@ts-nocheck

import * as moment from 'moment';
import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import {camelizeKeys, formatKeys} from "../utils/utils";
import AuditoriaService from '../services/AuditoriaService';

const router = express.Router();

router.get('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const hojas = await knex('HojasRuta')
          .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
          .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
          .where({Fecha: today});
        res.status(200).json(camelizeKeys(hojas));
    } catch (err) {
        next(err);
    }
});

router.get('/:hoja_id(\\d+)', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
        const hoja = await knex('HojasRuta').where({HojaRutaID: hoja_id}).first();
        res.status(200).json(camelizeKeys(hoja));
    } catch (err) {
        next(err);
    }
});

router.get('/fecha/:fecha', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const fecha = req.params.fecha;

	try {
        const hojas = await knex('HojasRuta').select('*').where({Fecha: fecha});
        res.status(200).json(camelizeKeys(hojas));
    } catch (err) {
        next(err);
    }
});

router.get('/estado/:estado', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const estado = req.params.estado;

	try {
        const hojas = await knex('HojasRuta').select('*').where({Estado: estado});
        res.status(200).json(camelizeKeys(hojas));
    } catch (err) {
        next(err);
    }
});

router.post('/', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const values = formatKeys(req.body);

    try {
        const hoja = (await knex('HojasRuta').insert(values, '*'))[0];
        AuditoriaService.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        res.status(200).json(camelizeKeys(hoja));
    } catch (err) {
        next(err);
    }
});

router.put('/:hoja_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const hoja_id = req.params.hoja_id;
    const values: any = formatKeys(req.body, 'hoja_ruta_id');

    try {
        const hoja = await knex('HojasRuta').where({HojaRutaID: hoja_id}).first();

        if (hoja) {
            const updatedHoja = (await knex('HojasRuta').where({HojaRutaID: hoja_id}).update(values, '*'))[0];
            AuditoriaService.log('hojas de ruta', updatedHoja.HojaRutaID, JSON.stringify(updatedHoja), 'update', req.user.username);
            res.status(200).json(camelizeKeys(updatedHoja));
        } else {
            res.status(400).json({error: `Hoja Ruta ID: ${hoja_id} no existe.`});
        }
    } catch (err) {
        next(err);
    }
});

router.delete('/:hoja_id', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const hoja_id = req.params.hoja_id;

    try {
        const deletedHoja = await knex('HojasRuta').where({HojaRutaID: hoja_id}).delete();

        if (deletedHoja) {
            res.status(200).json(`Hoja Ruta ID: ${hoja_id} eliminado satisfactoriamente`);
        } else {
            res.status(400).json({error: `Hoja Ruta ID: ${hoja_id} no existe.`});
        }
    } catch (err) {
        next(err);
    }
});

router.post('/:hoja_id/movimientos', authHelpers.ensureAuthenticated, authHelpers.ensureIsUser, async (req, res, next) => {
    const hoja_id = req.params.hoja_id;
    const values: any = formatKeys(req.body);

    try {
        const movimientos = await knex('MovimientosEnc').insert(values, '*');
        //AuditoriaService.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        res.status(200).json(movimientos || {});
    } catch (err) {
        next(err);
    }
});

export default router;
