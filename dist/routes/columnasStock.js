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
router.get('/columnasStock', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const columnasStock = yield connection_1.default('ColumnasStock').select('*');
        res.status(200).json(columnasStock);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/columnasStock', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const columnaStock = (yield connection_1.default('ColumnasStock').insert(values, '*'))[0];
        res.status(200).json(columnaStock);
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=columnasStock.js.map