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
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const condicionesVenta = yield connection_1.default('CondicionesVenta').select('*');
        res.status(200).json(utils_1.camelizeKeys(condicionesVenta));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const condicionVenta = (yield connection_1.default('CondicionesVenta').insert(values, '*'))[0];
        res.status(200).json(condicionVenta);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:condicion_venta_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const condicion_venta_id = req.params.condicion_venta_id;
    const values = req.body;
    try {
        const condicionVenta = yield connection_1.default('CondicionesVenta')
            .where({ CondicionVentaID: condicion_venta_id })
            .first();
        if (condicionVenta) {
            const updatedCondicionVenta = (yield connection_1.default('CondicionesVenta')
                .where({ CondicionVentaID: condicion_venta_id })
                .update(values, '*'))[0];
            res.status(200).json(updatedCondicionVenta);
        }
        else {
            res.status(400).json({ error: `Condicion de Venta ID: ${condicion_venta_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:condicion_venta_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const condicion_venta_id = req.params.condicion_venta_id;
    try {
        const deletedCondicionVenta = yield connection_1.default('CondicionesVenta')
            .where({ CondicionVentaID: condicion_venta_id })
            .delete();
        if (deletedCondicionVenta) {
            res.status(200).json(`Condicion de Venta ID: ${condicion_venta_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Condicion de Venta ID: ${condicion_venta_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=condicionesVenta.js.map