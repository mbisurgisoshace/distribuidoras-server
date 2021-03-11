"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const comodatos = yield connection_1.default('ComodatosEnc');
        yield Promise.all(comodatos.map((m) => __awaiter(this, void 0, void 0, function* () {
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
router.get('/:comodato_enc_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
router.get('/vigentes', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (Req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
router.get('/cliente/:cliente_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    try {
        const comodato = yield connection_1.default('ComodatosEnc').where({ ClienteID: cliente_id, vigente: true }).first();
        if (comodato) {
            const detalle = yield connection_1.default('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
            comodato.items = utils_1.camelizeKeys(detalle);
            res.status(200).json(utils_1.camelizeKeys(comodato));
        }
        else {
            res.status(200).json(null);
        }
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const comodato = (yield connection_1.default('ComodatosEnc').insert(values, '*'))[0];
        res.status(200).json(utils_1.camelizeKeys(comodato));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:comodato_enc_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    const comodato_enc_id = req.params.comodato_enc_id;
    try {
        const comodato = yield connection_1.default('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
        const items = yield connection_1.default('ComodatosDet').insert(values, '*');
        yield ComodatoService_1.default.insertarMovimientos(utils_1.camelizeKeys(comodato), utils_1.camelizeKeys(items), []);
        res.status(200).json(utils_1.camelizeKeys(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:comodato_enc_id/renovar', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const comodato_enc_id = req.params.comodato_enc_id;
    const comodatoEnc = R.omit(['items'], utils_1.formatKeys(req.body));
    const comodatoDet = R.pick(['items'], utils_1.formatKeys(req.body));
    try {
        const comodato = yield connection_1.default('ComodatosEnc').where({ ComodatoEncID: comodato_enc_id }).first();
        const detalle = yield connection_1.default('ComodatosDet').where({ ComodatoEncID: comodato.ComodatoEncID });
        comodato.items = utils_1.camelizeKeys(detalle);
        const newComodato = yield ComodatoService_1.default.insertarComodato(comodatoEnc, utils_1.formatKeys(comodatoDet.items));
        yield ComodatoService_1.default.insertarMovimientos(utils_1.camelizeKeys(newComodato), utils_1.camelizeKeys(newComodato.items), utils_1.camelizeKeys(comodato.items));
        yield connection_1.default('ComodatosEnc').update({ Vigente: false, Renovado: true, NroRenovacion: newComodato.NroComprobante }).where({ ComodatoEncID: comodato_enc_id });
        res.status(200).json(utils_1.camelizeKeys(newComodato));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/gestion', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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