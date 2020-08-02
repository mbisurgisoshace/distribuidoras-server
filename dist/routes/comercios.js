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
const R = require("ramda");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const AuditoriaService_1 = require("../services/AuditoriaService");
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { withStock } = req.query;
    try {
        const comercios = yield connection_1.default('Comercios').select('*');
        if (withStock) {
            for (let i = 0; i < comercios.length; i++) {
                let c = comercios[i];
                c.stock = yield getStockComercio(c);
            }
        }
        res.status(200).json(utils_1.camelizeKeys(comercios));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:comercio_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const comercio_id = req.params.comercio_id;
    try {
        const comercio = yield connection_1.default('Comercios').where({ id: comercio_id }).first();
        res.status(200).json(utils_1.camelizeKeys(comercio));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    values.Estado = true;
    try {
        const comercio = (yield connection_1.default('Comercios').insert(values, '*'))[0];
        AuditoriaService_1.default.log('comercios', comercio.id, JSON.stringify(comercio), 'insert', req.user.username);
        res.status(200).json(utils_1.camelizeKeys(comercio));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/:comercio_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const comercio_id = req.params.comercio_id;
    const values = R.omit(['id'], req.body);
    try {
        const comercio = yield connection_1.default('Comercios').where({ id: comercio_id }).first();
        if (comercio) {
            const updatedComercio = (yield connection_1.default('Comercios').where({ id: comercio_id }).update(values, '*'))[0];
            AuditoriaService_1.default.log('comercios', updatedComercio.id, JSON.stringify(updatedComercio), 'update', req.user.username);
            res.status(200).json(utils_1.camelizeKeys(updatedComercio));
        }
        else {
            res.status(404).json({ error: `Comercio ID: ${comercio_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.post('/pedidos', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const pedido = (yield connection_1.default('PedidosComercios').insert(values, '*'))[0];
        AuditoriaService_1.default.log('pedidos_comercios', pedido.id, JSON.stringify(pedido), 'insert', req.user.username);
        res.status(200).json(utils_1.camelizeKeys(pedido));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
function getStockComercio(comercio) {
    return __awaiter(this, void 0, void 0, function* () {
        const stock = yield connection_1.default('StockComercios')
            .select('envase_id')
            .sum('cantidad as cantidad')
            .groupBy('envase_id')
            .where({ comercio_id: comercio.id });
        const reserva = yield connection_1.default('PedidosComercios')
            .innerJoin('MovimientosEnc', 'PedidosComercios.movimiento_enc_id', 'MovimientosEnc.MovimientoEncID')
            .innerJoin('MovimientosDet', 'MovimientosEnc.MovimientoEncID', 'MovimientosDet.MovimientoEncID')
            .select('MovimientosDet.EnvaseID as envase_id')
            .sum('MovimientosDet.EnvaseID as cantidad')
            .groupBy('MovimientosDet.EnvaseID')
            .where({ comercio_id: comercio.id, entregado: false });
        return stock.map(s => {
            const envase = reserva.find(r => r.envase_id === s.envase_id);
            if (envase) {
                s.cantidad -= envase.cantidad;
            }
            return s;
        });
    });
}
exports.default = router;
//# sourceMappingURL=comercios.js.map