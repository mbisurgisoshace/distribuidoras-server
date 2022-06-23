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
        const subzonas = yield connection_1.default('ZonasSub').select('*');
        res.status(200).json(utils_1.camelizeKeys(subzonas));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.get('/:subzona_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const subzona_id = req.params.subzona_id;
    try {
        const subzona = yield connection_1.default('ZonasSub').where({ SubZonaID: subzona_id }).first();
        res.status(200).json(subzona);
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=subzonas.js.map