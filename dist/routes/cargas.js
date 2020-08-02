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
router.get('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const cargas = yield connection_1.default('CargasEnc').where({ HojaRutaID: hoja_id });
        yield Promise.all(cargas.map((c) => __awaiter(this, void 0, void 0, function* () {
            const detalle = yield connection_1.default('CargasDet').where({ CargaEncID: c.CargaEncID });
            utils_1.camelizeKeys(detalle);
            c.items = utils_1.camelizeKeys(detalle);
        })));
        res.status(200).json(utils_1.camelizeKeys(cargas));
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=cargas.js.map