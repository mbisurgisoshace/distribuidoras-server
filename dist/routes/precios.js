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
        const listasPrecio = yield connection_1.default('ListasPrecio').select('*');
        res.status(200).json(utils_1.camelizeKeys(listasPrecio));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:precio_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const precio_id = req.params.precio_id;
    try {
        const precios = yield connection_1.default('ListasPrecioDet').select('*').where({ ListaPrecioID: precio_id });
        res.status(200).json(utils_1.camelizeKeys(precios));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        yield connection_1.default.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            const precioEnc = (yield trx('ListasPrecio').insert({ ListaPrecioNombre: values.listaprecionombre }, '*'))[0];
            const items = values.items.map(item => (Object.assign({}, utils_1.formatKeys(item), { ListaPrecioID: precioEnc.ListaPrecioID })));
            yield trx('ListasPrecioDet').insert(items, '*');
        }));
        res.status(200).json('Ok');
    }
    catch (err) {
        next(err);
    }
}));
router.put('/:precio_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    const precio_id = req.params.precio_id;
    try {
        yield connection_1.default.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < values.items.length; i++) {
                const v = values.items[i];
                if (v.lista_precio_det_id) {
                    const id = v.lista_precio_det_id;
                    const updateRow = utils_1.formatKeys(v, 'lista_precio_det_id');
                    yield connection_1.default('ListasPrecioDet').where({ ListaPrecioDetID: id }).update(updateRow, '*');
                }
            }
        }));
        res.status(200).json('Ok');
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=precios.js.map