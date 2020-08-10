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
const R = require("ramda");
const moment = require("moment");
const express = require("express");
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
router.get('/pedidos', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const pedidos = yield connection_1.default('PedidosComercios')
            .select('PedidosComercios.*', 'Comercios.razon_social', 'Comercios.calle', 'Comercios.altura', 'Comercios.telefono')
            .innerJoin('Comercios', 'Comercios.id', 'PedidosComercios.comercio_id')
            .where({ entregado: false });
        res.status(200).json(utils_1.camelizeKeys(pedidos));
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
        res.status(200).json(pedido);
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/pedidos/entregar', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const ids = req.body;
    try {
        const pedidos = yield connection_1.default('PedidosComercios').whereIn('id', ids);
        yield Promise.all(pedidos.map((p) => __awaiter(this, void 0, void 0, function* () {
            // Reducir stock punto de entrega
            const items = yield connection_1.default('MovimientosDet').where({ MovimientoEncID: p.movimiento_enc_id });
            const stock = items.map(i => ({
                tipo: 'venta',
                fecha: p.fecha,
                envase_id: i.EnvaseID,
                cantidad: i.Cantidad * -1,
                comercio_id: p.comercio_id,
                movimiento_enc_id: p.movimiento_enc_id
            }));
            yield connection_1.default('StockComercios').insert(stock, '*');
            // Cambiar estado pedido a entregado
            yield connection_1.default('MovimientosEnc')
                .update({ EstadoMovimientoID: 3 }, '*')
                .where({ MovimientoEncID: p.movimiento_enc_id });
            // Si el pedido no fue pagado, generar movimiento cuenta corriente en punto de entrega
            if (!p.pagado) {
                const total = (yield connection_1.default('MovimientosDet')
                    .sum('Monto as total')
                    .where({ MovimientoEncID: p.movimiento_enc_id }))[0].total;
                const ctacte = {
                    tipo: 'credito',
                    fecha: moment().format('YYYY-MM-DD'),
                    monto: total,
                    comercio_id: p.comercio_id,
                    pedido_id: p.id,
                };
                yield connection_1.default('CuentaCorrienteComercios').insert(ctacte, '*');
            }
            // Cambiar el esatdo de la entrega a entregado
            yield connection_1.default('PedidosComercios')
                .update({ entregado: true }, '*')
                .where({ id: p.id });
        })));
        res.status(200).json(utils_1.camelizeKeys(pedidos));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/stock', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    try {
        const stock = (yield connection_1.default('StockComercios').insert(values, '*'))[0];
        yield createStockInterno(values[0].fecha, values[0].comprobante, values);
        AuditoriaService_1.default.log('stock_comercios', stock.id, JSON.stringify(stock), 'insert', req.user.username);
        res.status(200).json(stock);
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
function createStockInterno(fecha, comprobante, items) {
    return __awaiter(this, void 0, void 0, function* () {
        let stock = {
            Fecha: fecha,
            TipoMovimiento: 'Reposicion Punto Entrega',
            Modulo: 'Stock',
            NroComprobante: comprobante
        };
        stock = (yield connection_1.default('MovimientosStockEnc').insert(stock, '*'))[0];
        if (stock) {
            const stockItems = items.map(v => ({
                MovimientoStockEncID: stock.MovimientoStockEncID,
                EnvaseID: v.envase_id,
                EstadoEnvaseID: 1,
                Cantidad: v.cantidad * -1
            }));
            yield connection_1.default('MovimientosStockDet').insert(stockItems, '*');
        }
    });
}
exports.default = router;
//# sourceMappingURL=comercios.js.map