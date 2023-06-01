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
        let condicionesIva = yield (0, connection_1.default)('CondicionesIva').select('*');
        res.status(200).json((0, utils_1.camelizeKeys)(condicionesIva));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const condicionIva = (yield (0, connection_1.default)('CondicionesIva').insert(values, '*'))[0];
        res.status(200).json(condicionIva);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:condicion_iva_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const condicion_iva_id = req.params.condicion_iva_id;
    const values = req.body;
    try {
        const condicionIva = yield (0, connection_1.default)('CondicionesIva').where({ CondicionIvaID: condicion_iva_id }).first();
        if (condicionIva) {
            const updatedCondicionIva = (yield (0, connection_1.default)('CondicionesIva')
                .where({ CondicionIvaID: condicion_iva_id })
                .update(values, '*'))[0];
            res.status(200).json(updatedCondicionIva);
        }
        else {
            res.status(400).json({ error: `Condicion de Iva ID: ${condicion_iva_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:condicion_iva_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const condicion_iva_id = req.params.condicion_iva_id;
    try {
        const deletedCondicionIva = yield (0, connection_1.default)('CondicionesIva')
            .where({ CondicionIvaID: condicion_iva_id })
            .delete();
        if (deletedCondicionIva) {
            res.status(200).json(`Condicion de Iva ID: ${condicion_iva_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Condicion de Iva ID: ${condicion_iva_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=condicionesIva.js.map