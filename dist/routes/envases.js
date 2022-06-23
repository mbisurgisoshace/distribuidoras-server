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
        const envases = yield connection_1.default('Envases').select('*');
        res.status(200).json(utils_1.camelizeKeys(envases));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const envase = (yield connection_1.default('Envases').insert(values, '*'))[0];
        res.status(200).json(envase);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/envase_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const envase_id = req.params.envase_id;
    const values = req.body;
    try {
        const envase = yield connection_1.default('Envases').where({ EnvaseID: envase_id }).first();
        if (envase) {
            const updatedEnvase = (yield connection_1.default('Envases').where({ EnvaseID: envase_id }).update(values, '*'))[0];
            res.status(200).json(updatedEnvase);
        }
        else {
            res.status(400).json({ error: `Envase ID: ${envase_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/envase_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const envase_id = req.params.envase_id;
    try {
        const deletedEnvase = yield connection_1.default('Envases').where({ EnvaseID: envase_id }).delete();
        if (deletedEnvase) {
            res.status(200).json(`Envase ID: ${envase_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Envase ID: ${envase_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=envases.js.map