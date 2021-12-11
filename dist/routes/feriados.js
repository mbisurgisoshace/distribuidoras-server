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
        const feriados = yield connection_1.default('Feriados').select('*');
        res.status(200).json(utils_1.camelizeKeys(feriados));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const feriado = (yield connection_1.default('Feriados').insert(values, '*'))[0];
        res.status(200).json(feriado);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:feriado_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const feriado_id = req.params.feriado_id;
    const values = utils_1.formatKeys(req.body, 'feriado_id');
    try {
        const feriado = yield connection_1.default('Feriados').where({ FeriadoID: feriado_id }).first();
        if (feriado) {
            const updatedFeriado = (yield connection_1.default('Feriados').where({ FeriadoID: feriado_id }).update(values, '*'))[0];
            res.status(200).json(updatedFeriado);
        }
        else {
            res.status(400).json({ error: `Feriado ID: ${feriado_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:feriado_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const feriado_id = req.params.feriado_id;
    try {
        const deletedFeriado = yield connection_1.default('Feriados').where({ FeriadoID: feriado_id }).delete();
        if (deletedFeriado) {
            res.status(200).json(`Feriado ID: ${feriado_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Feriado ID: ${feriado_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=feriados.js.map