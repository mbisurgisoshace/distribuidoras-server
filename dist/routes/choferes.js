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
        const choferes = yield connection_1.default('Choferes').select('*');
        res.status(200).json(utils_1.camelizeKeys(choferes));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const chofer = (yield connection_1.default('Choferes').insert(values, '*'))[0];
        res.status(200).json(chofer);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/chofer_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const chofer_id = req.params.chofer_id;
    const values = req.body;
    try {
        const chofer = yield connection_1.default('Choferes').where({ ChoferID: chofer_id }).first();
        if (chofer) {
            const updatedChofer = (yield connection_1.default('Choferes').where({ ChoferID: chofer_id }).update(values, '*'))[0];
            res.status(200).json(updatedChofer);
        }
        else {
            res.status(400).json({ error: `Chofer ID: ${chofer_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/chofer_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const chofer_id = req.params.chofer_id;
    try {
        const deletedChofer = yield connection_1.default('Choferes').where({ ChoferID: chofer_id }).delete();
        if (deletedChofer) {
            res.status(200).json(`Chofer ID: ${chofer_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Chofer ID: ${chofer_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=choferes.js.map