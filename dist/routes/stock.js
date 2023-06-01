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
router.get('/columnasStock', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const columnasStock = yield (0, connection_1.default)('ColumnasStock').select('*');
        res.status(200).json(columnasStock);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/columnasStock', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const columnaStock = (yield (0, connection_1.default)('ColumnasStock').insert(values, '*'))[0];
        res.status(200).json(columnaStock);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/movimientos', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        const movimiento = (yield (0, connection_1.default)('MovimientosStockEnc').insert(values, '*'))[0];
        res.status(200).json((0, utils_1.camelizeKeys)(movimiento));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/movimientos/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        const items = yield (0, connection_1.default)('MovimientosStockDet').insert(values, '*');
        res.status(200).json((0, utils_1.camelizeKeys)(items));
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=stock.js.map