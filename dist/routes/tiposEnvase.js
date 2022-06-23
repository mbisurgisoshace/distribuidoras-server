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
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tiposEnvase = yield connection_1.default('EnvasesTipo').select('*');
        res.status(200).json(tiposEnvase);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const tipoEnvase = (yield connection_1.default('EnvasesTipo').insert(values, '*'))[0];
        res.status(200).json(tipoEnvase);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:tipo_envase_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tipo_envase_id = req.params.tipo_envase_id;
    const values = req.body;
    try {
        const tipoEnvase = yield connection_1.default('EnvasesTipo').where({ TipoEnvaseID: tipo_envase_id }).first();
        if (tipoEnvase) {
            const updatedTipoEnvase = (yield connection_1.default('EnvasesTipo')
                .where({ TipoEnvaseID: tipo_envase_id })
                .update(values, '*'))[0];
            res.status(200).json(updatedTipoEnvase);
        }
        else {
            res.status(400).json({ error: `Envase Tipo ID: ${tipo_envase_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:tipo_envase_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tipo_envase_id = req.params.tipo_envase_id;
    try {
        const deletedTipoEnvase = yield connection_1.default('EnvasesTipo')
            .where({ TipoEnvaseID: tipo_envase_id })
            .delete();
        if (deletedTipoEnvase) {
            res.status(200).json(`Envase Tipo ID: ${tipo_envase_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Envase Tipo ID: ${tipo_envase_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=tiposEnvase.js.map