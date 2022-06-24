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
const moment = require("moment");
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const AuditoriaService_1 = require("../services/AuditoriaService");
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = moment().format('YYYY-MM-DD');
        const hojas = yield connection_1.default('HojasRuta')
            .select('HojasRuta.*', 'Choferes.Apellido', 'Choferes.Nombre')
            .innerJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
            .where({ Fecha: today });
        res.status(200).json(utils_1.camelizeKeys(hojas));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:hoja_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const hoja = yield connection_1.default('HojasRuta').where({ HojaRutaID: hoja_id }).first();
        res.status(200).json(utils_1.camelizeKeys(hoja));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/fecha/:fecha', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const fecha = req.params.fecha;
    try {
        const hojas = yield connection_1.default('HojasRuta').select('*').where({ Fecha: fecha });
        res.status(200).json(utils_1.camelizeKeys(hojas));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/estado/:estado', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const estado = req.params.estado;
    try {
        const hojas = yield connection_1.default('HojasRuta').select('*').where({ Estado: estado });
        res.status(200).json(utils_1.camelizeKeys(hojas));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const hoja = (yield connection_1.default('HojasRuta').insert(values, '*'))[0];
        AuditoriaService_1.default.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        res.status(200).json(utils_1.camelizeKeys(hoja));
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    const values = utils_1.formatKeys(req.body, 'hoja_ruta_id');
    try {
        const hoja = yield connection_1.default('HojasRuta').where({ HojaRutaID: hoja_id }).first();
        if (hoja) {
            const updatedHoja = (yield connection_1.default('HojasRuta').where({ HojaRutaID: hoja_id }).update(values, '*'))[0];
            AuditoriaService_1.default.log('hojas de ruta', updatedHoja.HojaRutaID, JSON.stringify(updatedHoja), 'update', req.user.username);
            res.status(200).json(utils_1.camelizeKeys(updatedHoja));
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
        const deletedHoja = yield connection_1.default('HojasRuta').where({ HojaRutaID: hoja_id }).delete();
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
    const values = utils_1.formatKeys(req.body);
    try {
        const movimientos = yield connection_1.default('MovimientosEnc').insert(values, '*');
        //AuditoriaService.log('hojas de ruta', hoja.HojaRutaID, JSON.stringify(hoja), 'insert', req.user.username);
        res.status(200).json(movimientos || {});
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=hojas.js.map