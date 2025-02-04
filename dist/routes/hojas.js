"use strict";
//@ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const moment = require("moment");
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const AuditoriaService_1 = require("../services/AuditoriaService");
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let fecha = req.query.fecha;
        if (!fecha)
            fecha = moment().format('YYYY-MM-DD');
        //const today = moment().format('YYYY-MM-DD');
        const hojas = yield (0, connection_1.default)('HojasRuta')
            .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
            .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
            .where({ Fecha: fecha });
        res.status(200).json((0, utils_1.camelizeKeys)(hojas));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:hoja_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const hoja = yield (0, connection_1.default)('HojasRuta')
            .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
            .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
            .where({ HojaRutaID: hoja_id })
            .first();
        res.status(200).json((0, utils_1.camelizeKeys)(hoja));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/fecha/:fecha', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const fecha = req.params.fecha;
    try {
        const hojas = yield (0, connection_1.default)('HojasRuta').select('*').where({ Fecha: fecha });
        res.status(200).json((0, utils_1.camelizeKeys)(hojas));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/estado/:estado', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const estado = req.params.estado;
    try {
        const hojas = yield (0, connection_1.default)('HojasRuta')
            .select('HojasRuta.*', 'Choferes.Nombre', 'Choferes.Apellido')
            .where({ Estado: estado })
            .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID');
        res.status(200).json((0, utils_1.camelizeKeys)(hojas));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        const hoja = (yield (0, connection_1.default)('HojasRuta').insert(values, '*'))[0];
        AuditoriaService_1.default.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        res.status(200).json((0, utils_1.camelizeKeys)(hoja));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/abrir', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body.hojaRuta);
    const clientes = req.body.clientes;
    try {
        yield connection_1.default.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            const hoja = (yield trx('HojasRuta').insert(Object.assign(Object.assign({}, values), { KmFinal: 0, VentaContado: 0, VentaCtacte: 0, VentaTarjeta: 0, GastoCombustible: 0, GastoViatico: 0, GastoOtro: 0, Cobranza: 0, Cheques: 0, Efectivo: 0, Estado: true, CierreStock: false, ControlStock: false, CierreMobile: false }), '*'))[0];
            console.log('hoja', hoja);
            const HojaRutaID = hoja.HojaRutaID;
            for (let i = 0; i < clientes.length; i++) {
                const cliente = clientes[i];
                const movimientoEnc = {
                    Fecha: hoja.Fecha,
                    ClienteID: cliente.cliente_id,
                    HojaRutaID,
                    CondicionVentaID: cliente.condicion_venta_id,
                    TipoMovimientoID: 1,
                    EstadoMovimientoID: 1,
                    Visito: false,
                    Vendio: false,
                };
                yield trx('MovimientosEnc').insert(movimientoEnc);
            }
            AuditoriaService_1.default.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        }));
        res.status(200).json((0, utils_1.camelizeKeys)(hoja));
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    let values = (0, utils_1.formatKeys)(req.body, 'hoja_ruta_id');
    values = R.omit(['apellido', 'nombre'], values);
    try {
        const hoja = yield (0, connection_1.default)('HojasRuta').where({ HojaRutaID: hoja_id }).first();
        if (hoja) {
            const updatedHoja = (yield (0, connection_1.default)('HojasRuta').where({ HojaRutaID: hoja_id }).update(values, '*'))[0];
            AuditoriaService_1.default.log('hojas de ruta', updatedHoja.HojaRutaID, JSON.stringify(updatedHoja), 'update', req.user.username);
            res.status(200).json((0, utils_1.camelizeKeys)(updatedHoja));
        }
        else {
            res.status(400).json({ error: `Hoja Ruta ID: ${hoja_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        yield (0, connection_1.default)('CargasEnc').where({ HojaRutaID: hoja_id }).delete();
        yield (0, connection_1.default)('MovimientosEnc').where({ HojaRutaID: hoja_id }).delete();
        const deletedHoja = yield (0, connection_1.default)('HojasRuta').where({ HojaRutaID: hoja_id }).delete();
        if (deletedHoja) {
            res.status(200).json(`Hoja Ruta ID: ${hoja_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Hoja Ruta ID: ${hoja_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.post('/:hoja_id/movimientos', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        const movimientos = yield (0, connection_1.default)('MovimientosEnc').insert(values, '*');
        //AuditoriaService.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        res.status(200).json(movimientos || {});
    }
    catch (err) {
        next(err);
    }
}));
router.post('/search', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = req.body;
    try {
        let query = (0, connection_1.default)('HojasRuta')
            .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
            .leftOuterJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
            .orderBy('HojasRuta.HojaRutaID');
        if (filters.desde && filters.hasta) {
            const desde = moment(filters.desde, 'DD-MM-YYYY').format('YYYY-MM-DD');
            const hasta = moment(filters.hasta, 'DD-MM-YYYY').format('YYYY-MM-DD');
            query = query.andWhere(function () {
                this.andWhere('HojasRuta.Fecha', '>=', desde).andWhere('HojasRuta.Fecha', '<=', hasta);
            });
        }
        const hojas = (yield query) || [];
        res.send(hojas);
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=hojas.js.map