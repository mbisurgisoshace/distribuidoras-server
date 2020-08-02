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
        const canales = yield connection_1.default('Canales').select('*');
        res.status(200).json(utils_1.camelizeKeys(canales));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const canal = (yield connection_1.default('Canales').insert(values, '*'))[0];
        res.status(200).json(canal);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:canal_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const canal_id = req.params.canal_id;
    const values = req.body;
    try {
        const canal = yield connection_1.default('Canales').where({ CanalID: canal_id }).first();
        if (canal) {
            const updatedCanal = (yield connection_1.default('Canales').where({ CanalID: canal_id }).update(values, '*'))[0];
            res.status(200).json(updatedCanal);
        }
        else {
            res.status(400).json({ error: `Canal ID: ${canal_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:canal_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const canal_id = req.params.canal_id;
    try {
        const deletedCanal = yield connection_1.default('Canales').where({ CanalID: canal_id }).delete();
        if (deletedCanal) {
            res.status(200).json(`Canal ID: ${canal_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Canal ID: ${canal_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=canales.js.map