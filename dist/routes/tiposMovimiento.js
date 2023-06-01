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
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tiposMovimiento = yield (0, connection_1.default)('MovimientosTipo').select('*');
        res.status(200).json((0, utils_1.camelizeKeys)(tiposMovimiento));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const tipoMovimiento = (yield (0, connection_1.default)('MovimientosTipo').insert(values, '*'))[0];
        res.status(200).json(tipoMovimiento);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:tipo_movimiento_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tipo_movimiento_id = req.params.tipo_movimiento_id;
    const values = req.body;
    try {
        const tipoMovimiento = yield (0, connection_1.default)('MovimientosTipo').where({ TipoMovimientoID: tipo_movimiento_id }).first();
        if (tipoMovimiento) {
            const updatedTipoMovimiento = (yield (0, connection_1.default)('MovimientosTipo')
                .where({ TipoMovimientoID: tipo_movimiento_id })
                .update(values, '*'))[0];
            res.status(200).json(updatedTipoMovimiento);
        }
        else {
            res.status(400).json({ error: `Movimiento Tipo ID: ${tipo_movimiento_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:tipo_movimiento_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tipo_movimiento_id = req.params.tipo_movimiento_id;
    try {
        const deletedTipoMovimiento = yield (0, connection_1.default)('MovimientosTipo')
            .where({ TipoMovimientoID: tipo_movimiento_id })
            .delete();
        if (deletedTipoMovimiento) {
            res.status(200).json(`Movimiento Tipo ID: ${tipo_movimiento_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Movimiento Tipo ID: ${tipo_movimiento_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=tiposMovimiento.js.map