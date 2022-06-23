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
        const camiones = yield connection_1.default('Camiones').select('*');
        res.status(200).json(utils_1.camelizeKeys(camiones));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const camion = (yield connection_1.default('Camiones').insert(values, '*'))[0];
        res.status(200).json(camion);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/camion_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const camion_id = req.params.camion_id;
    const values = req.body;
    try {
        const camion = yield connection_1.default('Camiones').where({ CamionID: camion_id }).first();
        if (camion) {
            const updatedCamion = (yield connection_1.default('Camiones').where({ CamionID: camion_id }).update(values, '*'))[0];
            res.status(200).json(updatedCamion);
        }
        else {
            res.status(400).json({ error: `Camion ID: ${camion_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/camion_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const camion_id = req.params.camion_id;
    try {
        const deletedCamion = yield connection_1.default('Camiones').where({ CamionID: camion_id }).delete();
        if (deletedCamion) {
            res.status(200).json(`Camion ID: ${camion_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Camion ID: ${camion_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=camiones.js.map