"use strict";
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
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const router = express.Router();
router.get('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const cargas = yield (0, connection_1.default)('CargasEnc').where({ HojaRutaID: hoja_id });
        yield Promise.all(cargas.map((c) => __awaiter(void 0, void 0, void 0, function* () {
            const detalle = yield (0, connection_1.default)('CargasDet').where({ CargaEncID: c.CargaEncID });
            (0, utils_1.camelizeKeys)(detalle);
            c.items = (0, utils_1.camelizeKeys)(detalle);
        })));
        res.status(200).json((0, utils_1.camelizeKeys)(cargas));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:hoja_id/:tipo_carga_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    const tipo_carga_id = req.params.tipo_carga_id;
    try {
        const carga = yield (0, connection_1.default)('CargasEnc')
            .where({ HojaRutaID: hoja_id, CargaTipoID: tipo_carga_id })
            .first();
        if (carga) {
            const detalle = yield (0, connection_1.default)('CargasDet').where({ CargaEncID: carga.CargaEncID });
            const items = (0, utils_1.camelizeKeys)(detalle);
            return res.status(200).json((0, utils_1.camelizeKeys)(Object.assign(Object.assign({}, carga), { items })));
        }
        res.status(200).json(null);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cargaEnc = (0, utils_1.formatKeys)(req.body, 'items');
        const cargaDet = (0, utils_1.formatKeys)(req.body.items);
        let newCarga;
        const items = [];
        yield connection_1.default.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            newCarga = (yield trx('CargasEnc').insert(cargaEnc, '*'))[0];
            console.log(newCarga);
            for (let i = 0; i < cargaDet.length; i++) {
                let detalle = cargaDet[i];
                detalle.cargaEncId = newCarga.CargaEncID;
                console.log(detalle);
                const newDetalle = yield trx('CargasDet').insert(detalle, '*');
                items.push((0, utils_1.camelizeKeys)(newDetalle));
            }
        }));
        res.status(200).json((0, utils_1.camelizeKeys)(Object.assign(Object.assign({}, newCarga), { items })));
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:carga_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const carga_enc_id = req.params.carga_enc_id;
    try {
        const cargaEnc = (0, utils_1.formatKeys)(req.body, 'items');
        const cargaDet = (0, utils_1.formatKeys)(req.body.items);
        const items = [];
        console.log(cargaEnc);
        console.log(cargaDet);
        yield connection_1.default.transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            yield trx('CargasDet').delete().where({ CargaEncID: carga_enc_id });
            for (let i = 0; i < cargaDet.length; i++) {
                let detalle = cargaDet[i];
                delete detalle.cargadetid;
                delete detalle.cargaencid;
                console.log(detalle);
                detalle.cargaEncId = carga_enc_id;
                const updateDetalle = yield trx('CargasDet').insert(detalle, '*');
                items.push((0, utils_1.camelizeKeys)(updateDetalle));
            }
        }));
        res.status(200).json((0, utils_1.camelizeKeys)(Object.assign(Object.assign({}, cargaEnc), { items })));
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=cargas.js.map