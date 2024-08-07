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
        const zonas = yield (0, connection_1.default)('Zonas').select('*').where('habilitado', true);
        res.status(200).json((0, utils_1.camelizeKeys)(zonas));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.get('/:zona_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const zona_id = req.params.zona_id;
    try {
        const zona = yield (0, connection_1.default)('Zonas').where({ ZonaID: zona_id }).first();
        res.status(200).json(zona);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    try {
        const zona = (yield (0, connection_1.default)('Zonas').insert(values, '*'))[0];
        res.status(200).json(zona);
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:zona_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const zona_id = req.params.zona_id;
    const values = req.body;
    try {
        const zona = yield (0, connection_1.default)('Zonas').where({ ZonaID: zona_id }).first();
        if (zona) {
            const updatedZona = (yield (0, connection_1.default)('Zonas').where({ ZonaID: zona_id }).update(values, '*'))[0];
            res.status(200).json(updatedZona);
        }
        else {
            res.status(400).json({ error: `Zona ID: ${zona_id} no existe.` });
        }
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.delete('/:zona_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const zona_id = req.params.zona_id;
    try {
        const deletedZona = yield (0, connection_1.default)('Zonas').where({ ZonaID: zona_id }).delete();
        if (deletedZona) {
            res.status(200).json(`Zona ID: ${zona_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(400).json({ error: `Zona ID: ${zona_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=zonas.js.map