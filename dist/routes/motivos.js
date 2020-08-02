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
        const motivos = yield connection_1.default('Motivos').select('*');
        res.status(200).json(motivos);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const motivo = (yield connection_1.default('Motivos').insert(values, '*'))[0];
        res.status(200).json(motivo);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:motivo_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const motivo_id = req.params.motivo_id;
    const values = req.body;
    try {
        const motivo = yield connection_1.default('Motivos').where({ MotivoID: motivo_id }).first();
        if (motivo) {
            const updatedMotivo = (yield connection_1.default('Motivos').where({ MotivoID: motivo_id }).update(values, '*'))[0];
            res.status(200).json(updatedMotivo);
        }
        else {
            res.status(400).json({ error: `Motivo ID: ${motivo_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:motivo_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const motivo_id = req.params.motivo_id;
    try {
        const deletedMotivo = yield connection_1.default('Motivos').where({ MotivoID: motivo_id }).delete();
        if (deletedMotivo) {
            res.status(200).json(`Motivo ID: ${motivo_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Motivo ID: ${motivo_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=motivos.js.map