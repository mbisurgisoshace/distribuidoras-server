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
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const router = express.Router();
router.get('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const movimientos = yield connection_1.default('MovimientosEnc').where({ HojaRutaID: hoja_id });
        yield Promise.all(movimientos.map((m) => __awaiter(this, void 0, void 0, function* () {
            const detalle = yield connection_1.default('MovimientosDet').where({ MovimientoEncID: m.MovimientoEncID });
            utils_1.camelizeKeys(detalle);
            m.items = utils_1.camelizeKeys(detalle);
        })));
        res.status(200).json(utils_1.camelizeKeys(movimientos));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const movimiento = (yield connection_1.default('MovimientosEnc').insert(values, '*'))[0];
        res.status(200).json(utils_1.camelizeKeys(movimiento));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const items = yield connection_1.default('MovimientosDet').insert(values, '*');
        res.status(200).json(utils_1.camelizeKeys(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=movimientos.js.map