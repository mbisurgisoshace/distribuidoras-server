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
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const ComodatoService_1 = require("../services/ComodatoService");
const AuditoriaService_1 = require("../services/AuditoriaService");
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comodatos = yield connection_1.default('ComodatosEnc');
        yield Promise.all(comodatos.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            const detalle = yield connection_1.default('ComodatosDet').where({ ComodatoEncID: m.ComodatoEncID });
            utils_1.camelizeKeys(detalle);
            m.items = utils_1.camelizeKeys(detalle);
        })));
        res.status(200).json(utils_1.camelizeKeys(comodatos));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:comodato_enc_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comodato_enc_id = req.params.comodato_enc_id;
    try {
        const comodato = yield connection_1.default('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
        const detalle = yield connection_1.default('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
        comodato.items = utils_1.camelizeKeys(detalle);
        res.status(200).json(utils_1.camelizeKeys(comodato));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/vigentes', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (Req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comodatos = yield connection_1.default('ComodatosEnc')
            .select('ComodatosEnc.*', 'Clientes.RazonSocial')
            .innerJoin('Clientes', 'Clientes.ClienteID', 'ComodatosEnc.ClienteID')
            .where({ Vigente: true });
        res.status(200).json(utils_1.camelizeKeys(comodatos));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/cliente/:cliente_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    try {
        const comodatos = yield connection_1.default('ComodatosEnc')
            .where({ ClienteID: cliente_id, vigente: true });
        for (let i = 0; i < comodatos.length; i++) {
            let comodato = comodatos[i];
            const detalle = yield connection_1.default('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
            comodato.items = utils_1.camelizeKeys(detalle);
        }
        // if (comodato) {
        //   const detalle = await knex('ComodatosDet').where({ComodatoEncID: comodato.ComodatoEncID});
        //   comodato.items = camelizeKeys(detalle);
        //   res.status(200).json(camelizeKeys(comodato));
        // } else {
        //   res.status(200).json(null);
        // }
        res.status(200).json(utils_1.camelizeKeys(comodatos));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const comodato = (yield connection_1.default('ComodatosEnc').insert(values, '*'))[0];
        AuditoriaService_1.default.log('comodatos', comodato.ComodatoEncID, JSON.stringify(comodato), 'insert', req.user.username);
        res.status(200).json(utils_1.camelizeKeys(comodato));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:comodato_enc_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    const comodato_enc_id = req.params.comodato_enc_id;
    try {
        const comodato = yield connection_1.default('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
        const items = yield connection_1.default('ComodatosDet').insert(values, '*');
        if (comodato.Tipo !== 'renovacion') {
            yield ComodatoService_1.default.insertarMovimientos(utils_1.camelizeKeys(comodato), utils_1.camelizeKeys(items));
        }
        res.status(200).json(utils_1.camelizeKeys(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:comodato_enc_id/renovar', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const comodato_enc_id = req.params.comodato_enc_id;
    const comodatoEnc = R.omit(['items'], utils_1.formatKeys(req.body));
    const comodatoDet = R.pick(['items'], utils_1.formatKeys(req.body));
    try {
        const comodato = yield connection_1.default('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
        const detalle = yield connection_1.default('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
        comodato.items = utils_1.camelizeKeys(detalle);
        const newComodato = yield ComodatoService_1.default.insertarComodato(comodatoEnc, utils_1.formatKeys(comodatoDet.items));
        //await ComodatoService.insertarMovimientos(camelizeKeys(newComodato), camelizeKeys(newComodato.items), camelizeKeys(comodato.items));
        yield connection_1.default('ComodatosEnc').update({ Vigente: false, Renovado: true, NroRenovacion: newComodato.NroComprobante }).where({ ComodatoEncID: comodato_enc_id });
        res.status(200).json(utils_1.camelizeKeys(newComodato));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/renovar', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const values = req.body;
        for (let i = 0; i < values.length; i++) {
            let comodato = values[i];
            let comodatoId = comodato.comodato_enc_id;
            comodato = R.omit(['comodato_enc_id', 'items'], comodato);
            yield connection_1.default('ComodatosEnc').update({
                ClienteID: comodato.cliente_id,
                Fecha: comodato.fecha,
                NroComprobante: comodato.nro_comprobante,
                Monto: comodato.monto,
                FechaVencimiento: comodato.fecha_vencimiento,
                FechaRenovacion: comodato.fecha_renovacion,
                Vigente: comodato.vigente,
                Renovado: comodato.renovado,
                NroRenovacion: comodato.nro_renovacion,
                Observaciones: comodato.observaciones,
                ChoferID: comodato.chofer_id,
                Tipo: comodato.tipo
            }).where({ ComodatoEncID: comodatoId });
        }
        res.status(200).json('Ok');
    }
    catch (err) {
        next(err);
    }
}));
router.post('/gestion', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const values = req.body;
        const gestion = (yield connection_1.default('ComodatosGestion').insert(values, '*'))[0];
        res.status(200).json(utils_1.camelizeKeys(gestion));
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=comodatos.js.map