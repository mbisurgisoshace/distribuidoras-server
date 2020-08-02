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
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const estadosEnvase = yield connection_1.default('EnvasesEstado').select('*');
        res.status(200).json(estadosEnvase);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const estadoEnvase = (yield connection_1.default('EnvasesEstado').insert(values, '*'))[0];
        res.status(200).json(estadoEnvase);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/estado_envase_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const estado_envase_id = req.params.estado_envase_id;
    const values = req.body;
    try {
        const estadoEnvase = yield connection_1.default('EnvasesEstado')
            .where({ EstadoEnvaseID: estado_envase_id })
            .first();
        if (estadoEnvase) {
            const updatedEstadoEnvase = (yield connection_1.default('EnvasesEstado')
                .where({ EstadoEnvaseID: estado_envase_id })
                .update(values, '*'))[0];
            res.status(200).json(updatedEstadoEnvase);
        }
        else {
            res.status(400).json({ error: `Envase Estado ID: ${estado_envase_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/estado_envase_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const estado_envase_id = req.params.estado_envase_id;
    try {
        const deletedEstadoEnvase = yield connection_1.default('EnvasesEstado')
            .where({ EstadoEnvaseID: estado_envase_id })
            .delete();
        if (deletedEstadoEnvase) {
            res.status(200).json(`Envase Estado ID: ${estado_envase_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Envase Estado ID: ${estado_envase_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=estadosEnvase.js.map