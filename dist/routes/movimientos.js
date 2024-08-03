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
const moment = require("moment");
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const PedidoService_1 = require("../services/PedidoService");
const router = express.Router();
router.get('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const movimientos = yield (0, connection_1.default)('MovimientosEnc').where({ HojaRutaID: hoja_id });
        yield Promise.all(movimientos.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            const detalle = yield (0, connection_1.default)('MovimientosDet').where({
                MovimientoEncID: m.MovimientoEncID,
            });
            (0, utils_1.camelizeKeys)(detalle);
            m.items = (0, utils_1.camelizeKeys)(detalle);
        })));
        res.status(200).json((0, utils_1.camelizeKeys)(movimientos));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/movimiento/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const movimiento_enc_id = req.params.movimiento_enc_id;
    try {
        const movimiento = yield (0, connection_1.default)('MovimientosEnc')
            .where({ MovimientoEncID: movimiento_enc_id })
            .first();
        movimiento.fecha = moment(movimiento.Fecha).utc().format('DD-MM-YYYY');
        const items = yield (0, connection_1.default)('MovimientosDet').where({
            MovimientoEncID: movimiento.MovimientoEncID,
        });
        movimiento.items = (0, utils_1.camelizeKeys)(items);
        movimiento.items = movimiento.items.map((item) => (Object.assign(Object.assign({}, item), { precio: item.monto / item.cantidad })));
        res.status(200).json((0, utils_1.camelizeKeys)(movimiento));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.get('/movimiento/:movimiento_enc_id/detalle', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const movimiento_enc_id = req.params.movimiento_enc_id;
    try {
        const detalle = yield (0, connection_1.default)('MovimientosDet')
            .select('MovimientosDet.*', 'Envases.EnvaseNombre')
            .innerJoin('Envases', 'Envases.EnvaseID', 'MovimientosDet.EnvaseID')
            .where({ MovimientoEncID: movimiento_enc_id });
        res.status(200).json((0, utils_1.camelizeKeys)(detalle));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/search', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = req.body;
    try {
        let query = (0, connection_1.default)('MovimientosEnc')
            .leftOuterJoin('HojasRuta', 'HojasRuta.HojaRutaID', 'MovimientosEnc.HojaRutaID')
            //.leftOuterJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
            .leftOuterJoin('Clientes', 'Clientes.ClienteID', 'MovimientosEnc.ClienteID')
            .distinct('MovimientosEnc.MovimientoEncID')
            .orderBy('MovimientosEnc.MovimientoEncID');
        if (filters.desde && filters.hasta) {
            const desde = moment(filters.desde, 'DD-MM-YYYY').format('YYYY-MM-DD');
            const hasta = moment(filters.hasta, 'DD-MM-YYYY').format('YYYY-MM-DD');
            query = query.andWhere(function () {
                this.andWhere('MovimientosEnc.Fecha', '>=', desde).andWhere('MovimientosEnc.Fecha', '<=', hasta);
            });
        }
        if (filters.chofer) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.chofer)) {
                    this.orWhere('HojasRuta.ChoferID', `${value}`);
                }
            });
        }
        if (filters.estado) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.estado)) {
                    this.orWhere('MovimientosEnc.EstadoMovimientoID', `${value}`);
                }
            });
        }
        if (filters.tipos) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.tipos)) {
                    this.orWhere('MovimientosEnc.TipoMovimientoID', `${value}`);
                }
            });
        }
        if (filters.condicion) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.condicion)) {
                    this.orWhere('MovimientosEnc.CondicionVentaID', `${value}`);
                }
            });
        }
        if (filters.canal) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.canal)) {
                    this.orWhere('Clientes.CanalID', `${value}`);
                }
            });
        }
        console.log('knex query string: ', query.toString());
        let innerResult = ((yield query) || [])
            .map((res) => res.MovimientoEncID)
            .filter((val) => val);
        const pedidos = yield (0, connection_1.default)('viewMonitor2')
            .whereIn('MovimientoEncID', innerResult)
            .timeout(30000);
        const itemsPedido = yield (0, connection_1.default)('MovimientosDet')
            .innerJoin('Envases', 'Envases.EnvaseID', 'MovimientosDet.EnvaseID')
            .whereIn('MovimientoEncID', pedidos.map((pedido) => pedido.MovimientoEncID));
        const pedidosConDetalle = pedidos.map((pedido) => {
            let detalle = '';
            const items = itemsPedido.filter((item) => item.MovimientoEncID === pedido.MovimientoEncID);
            items.forEach((item) => {
                let precio = '-';
                if (item.Monto && item.Cantidad) {
                    precio = (item.Monto / item.Cantidad).toFixed(2);
                }
                detalle += `${item.EnvaseNombre}*${item.Cantidad}*${precio};`;
                console.log('detalle', detalle);
            });
            return Object.assign(Object.assign({}, pedido), { Detalle: detalle });
        });
        res.send(pedidosConDetalle);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        //const movimiento = (await knex('MovimientosEnc').insert(values, '*'))[0];
        const newPedidoId = yield PedidoService_1.default.insertarPedido(values);
        if (!newPedidoId) {
            throw new Error('Ha ocurrido un error al generar el pedido.');
        }
        res.status(200).json(newPedidoId);
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        const items = yield (0, connection_1.default)('MovimientosDet').insert(values, '*');
        res.status(200).json((0, utils_1.camelizeKeys)(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/actualizacion_masiva', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = req.body;
    const ids = values.ids;
    const actualizaciones = (0, utils_1.formatKeys)(values.actualizaciones);
    console.log('ids', ids);
    console.log('actualizaciones', actualizaciones);
    try {
        yield (0, connection_1.default)('MovimientosEnc').update(actualizaciones, '*').whereIn('MovimientoEncID', ids);
        res.status(200).json('ok');
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, 
//shouldAllowUpdate,
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v.movimientodetid) {
                const id = v.movimientodetid;
                const updateRow = (0, utils_1.formatKeys)(v, 'movimientodetid');
                yield (0, connection_1.default)('MovimientosDet').where({ MovimientoDetID: id }).update(updateRow, '*');
            }
            else {
                yield (0, connection_1.default)('MovimientosDet').insert(v, '*');
            }
        }
        const items = [];
        res.status(200).json((0, utils_1.camelizeKeys)(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/movimiento/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const movimiento_enc_id = req.params.movimiento_enc_id;
    const values = (0, utils_1.formatKeys)(req.body);
    try {
        // const movimiento = (
        //   await knex('MovimientosEnc')
        //     .where({ MovimientoEncID: movimiento_enc_id })
        //     .update(values, '*')
        // )[0];
        yield PedidoService_1.default.updatePedido(movimiento_enc_id, values);
        res.status(200).json('Ok');
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=movimientos.js.map