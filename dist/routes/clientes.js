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
const AuditoriaService_1 = require("../services/AuditoriaService");
const moment = require("moment");
const router = express.Router();
router.get('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const clientes = yield connection_1.default('Clientes').select('*');
        res.status(200).json(utils_1.camelizeKeys(clientes));
    }
    catch (err) {
        next(err);
    }
}));
router.post('/search', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const filters = req.body;
    try {
        // let query = knex('Clientes')
        //   .leftOuterJoin('Canales', 'Canales.CanalID', 'Clientes.CanalID')
        //   .leftOuterJoin('MovimientosEnc', 'MovimientosEnc.ClienteID', 'Clientes.ClienteID')
        //   //.leftOuterJoin('MovimientosDet', 'MovimientosDet.MovimientoEncID', 'MovimientosEnc.MovimientoEncID')
        //   .leftOuterJoin('ZonasSub', 'ZonasSub.SubZonaID', 'Clientes.ZonaSubID')
        //   .leftOuterJoin('Zonas', 'Zonas.ZonaID', 'ZonasSub.ZonaID')
        //   .distinct('Clientes.ClienteID')
        let query = connection_1.default('Clientes')
            .leftOuterJoin('Canales', 'Canales.CanalID', 'Clientes.CanalID')
            .leftOuterJoin('MovimientosEnc', 'MovimientosEnc.ClienteID', 'Clientes.ClienteID')
            //.leftOuterJoin('MovimientosDet', 'MovimientosDet.MovimientoEncID', 'MovimientosEnc.MovimientoEncID')
            .leftOuterJoin('ZonasSub', 'ZonasSub.SubZonaID', 'Clientes.ZonaSubID')
            .leftOuterJoin('Zonas', 'Zonas.ZonaID', 'ZonasSub.ZonaID')
            .distinct('MovimientosEnc.MovimientoEncID');
        if (filters.canales) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.canales)) {
                    this.orWhere('Clientes.CanalID', `${value}`);
                }
            });
        }
        if (filters.zonas) {
            query = query.andWhere(function () {
                for (let value of Object.values(filters.zonas)) {
                    this.orWhere('Zonas.ZonaID', `${value}`);
                }
            });
        }
        if (filters.rango_fechas) {
            query = query.andWhere(function () {
                this.andWhere('MovimientosEnc.EstadoMovimientoID', 3);
                if (filters.rango_fechas.start && filters.rango_fechas.end) {
                    const desde = moment(filters.rango_fechas.start, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    const hasta = moment(filters.rango_fechas.end, 'DD-MM-YYYY').format('YYYY-MM-DD');
                    this
                        .andWhere('MovimientosEnc.Fecha', '>=', desde)
                        .andWhere('MovimientosEnc.Fecha', '<=', hasta);
                }
                else {
                    if (filters.rango_fechas.start) {
                        const desde = moment(filters.rango_fechas.start, 'DD-MM-YYYY').format('YYYY-MM-DD');
                        this.orWhere('MovimientosEnc.Fecha', '>=', desde);
                    }
                    if (filters.rango_fechas.end) {
                        const hasta = moment(filters.rango_fechas.end, 'DD-MM-YYYY').format('YYYY-MM-DD');
                        this.orWhere('MovimientosEnc.Fecha', '<=', hasta);
                    }
                }
            });
        }
        query = query.andWhere('Clientes.Latitud', '!=', 0);
        query = query.andWhere('Clientes.Longitud', '!=', 0);
        console.log('knex query string: ', query.toString());
        // let innerResult = ((await query) || [])
        //   .map((res: any) => res.ClienteID)
        //   .filter(val => val);
        let innerResult = ((yield query) || [])
            .map((res) => res.MovimientoEncID)
            .filter(val => val);
        console.log('innerResult', innerResult);
        let query_comercial = connection_1.default('MovimientosEnc')
            .leftOuterJoin('MovimientosDet', 'MovimientosDet.MovimientoEncID', 'MovimientosEnc.MovimientoEncID')
            .leftOuterJoin('Envases', 'Envases.EnvaseID', 'MovimientosDet.EnvaseID')
            .whereIn('MovimientosEnc.MovimientoEncID', innerResult)
            .distinct('MovimientosEnc.ClienteID')
            .groupBy('MovimientosEnc.ClienteID');
        if (filters.tipo_producto) {
            query_comercial = connection_1.default('viewTotalesPorTipoEnvase')
                .whereIn('MovimientoEncID', innerResult);
            if (filters.tipo_producto.butano && (filters.tipo_producto.butano.min || filters.tipo_producto.butano.max)) {
                query_comercial = query_comercial.andWhere(function () {
                    this.andWhere('TipoEnvaseID', 1);
                    if (filters.tipo_producto.butano.min && filters.tipo_producto.butano.max) {
                        const min = filters.tipo_producto.butano.min;
                        const max = filters.tipo_producto.butano.max;
                        this
                            .andWhere('TotalKilos', '>=', min)
                            .andWhere('TotalKilos', '<=', max);
                    }
                    else {
                        if (filters.tipo_producto.butano.min) {
                            const min = filters.tipo_producto.butano.min;
                            this.andWhere('TotalKilos', '>=', min);
                        }
                        if (filters.tipo_producto.butano.max) {
                            const max = filters.tipo_producto.butano.max;
                            this.andWhere('TotalKilos', '<=', max);
                        }
                    }
                });
            }
            if (filters.tipo_producto.propano && (filters.tipo_producto.propano.min || filters.tipo_producto.propano.max)) {
                query_comercial = query_comercial.andWhere(function () {
                    this.andWhere('TipoEnvaseID', 2);
                    if (filters.tipo_producto.propano.min && filters.tipo_producto.propano.max) {
                        const min = filters.tipo_producto.propano.min;
                        const max = filters.tipo_producto.propano.max;
                        this
                            .andWhere('TotalKilos', '>=', min)
                            .andWhere('TotalKilos', '<=', max);
                    }
                    else {
                        if (filters.tipo_producto.propano.min) {
                            const min = filters.tipo_producto.propano.min;
                            this.andWhere('TotalKilos', '>=', min);
                        }
                        if (filters.tipo_producto.propano.max) {
                            const max = filters.tipo_producto.propano.max;
                            this.andWhere('TotalKilos', '<=', max);
                        }
                    }
                });
            }
        }
        if (filters.producto) {
        }
        console.log('knex query_comercial string: ', query_comercial.toString());
        let outerResult = ((yield query_comercial) || [])
            .map((res) => res.ClienteID)
            .filter(val => val);
        console.log('outerResult', outerResult);
        //const result = await knex('Clientes').whereIn('ClienteID', innerResult);
        const result = yield connection_1.default('Clientes').whereIn('ClienteID', outerResult);
        res.send(utils_1.camelizeKeys(result));
        //res.send(camelizeKeys([]));
    }
    catch (err) {
        console.log('err', err);
        res.send(utils_1.camelizeKeys([]));
    }
}));
router.get('/:cliente_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    try {
        const cliente = yield connection_1.default('Clientes').where({ ClienteID: cliente_id }).first();
        res.status(200).json(utils_1.camelizeKeys(cliente));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/canal/:canal_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const canal_id = req.params.canal_id;
    try {
        const clientes = yield connection_1.default('Clientes').where({ CanalID: canal_id });
        res.status(200).json(utils_1.camelizeKeys(clientes));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/plantilla', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { zonaId, diaSemana } = req.query;
    try {
        const zonasSub = yield connection_1.default('ZonasSub').where({ ZonaID: zonaId }).select('*');
        const clientes = yield connection_1.default('Plantillas')
            .innerJoin('Clientes', 'Clientes.ClienteID', 'Plantillas.ClienteID')
            .whereIn('Clientes.ZonaSubID', zonasSub.map(zs => zs.SubZonaID))
            .andWhere('DiaSemana', diaSemana)
            .select('Clientes.*');
        res.status(200).json(utils_1.camelizeKeys(clientes));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/last', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const lastCodigo = (yield connection_1.default('Clientes').first().orderBy('ClienteID', 'desc').pluck('ClienteID'))[0] + 1;
        res.status(200).json(lastCodigo);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body, 'cliente_id');
    values.Estado = true;
    try {
        const cliente = (yield connection_1.default('Clientes').insert(values, '*'))[0];
        AuditoriaService_1.default.log('clientes', cliente.ClienteID, JSON.stringify(cliente), 'insert', req.user.username);
        res.status(200).json(utils_1.camelizeKeys(cliente));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/:cliente_id(\\d+)', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    const values = utils_1.formatKeys(req.body, 'cliente_id');
    try {
        const cliente = yield connection_1.default('Clientes').where({ ClienteID: cliente_id }).first();
        if (cliente) {
            const updatedCliente = (yield connection_1.default('Clientes').where({ ClienteID: cliente_id }).update(values, '*'))[0];
            AuditoriaService_1.default.log('clientes', updatedCliente.ClienteID, JSON.stringify(updatedCliente), 'update', req.user.username);
            res.status(200).json(utils_1.camelizeKeys(updatedCliente));
        }
        else {
            res.status(404).json({ error: `Cliente ID: ${cliente_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.delete('/:cliente_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    try {
        const deletedCliente = yield connection_1.default('Clientes').where({ ClienteID: cliente_id }).delete();
        if (deletedCliente) {
            AuditoriaService_1.default.log('clientes', deletedCliente.ClienteID, JSON.stringify(deletedCliente), 'delete', req.user.username);
            res.status(200).json(`Cliente ID: ${cliente_id} eliminado satisfactoriamente`);
        }
        else {
            res.status(404).json({ error: `Cliente ID: ${cliente_id} no existe.` });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:cliente_id/last', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    try {
        const lastPedidoId = yield connection_1.default('MovimientosEnc')
            .where({ ClienteID: cliente_id })
            .orderBy('fecha', 'desc')
            .first()
            .pluck('MovimientoEncID');
        if (lastPedidoId[0]) {
            let items = yield connection_1.default('MovimientosEnc')
                .innerJoin('MovimientosDet', 'MovimientosEnc.MovimientoEncID', 'MovimientosDet.MovimientoEncID')
                .innerJoin('Envases', 'MovimientosDet.EnvaseID', 'Envases.EnvaseID')
                .where('MovimientosEnc.MovimientoEncID', lastPedidoId[0])
                .select('EnvaseCodigo', 'EnvaseNombre', 'Cantidad', 'Monto');
            if (items && items.length > 0) {
                items = items.map(i => {
                    let precio = i.Monto / i.Cantidad;
                    return Object.assign({}, i, { precio });
                });
            }
            let lastPedido = {
                pedido_id: lastPedidoId[0],
                items: utils_1.camelizeKeys(items)
            };
            res.status(200).json(lastPedido);
        }
        else {
            res.status(404).json({ error: 'El cliente no tiene pedidos.' });
        }
    }
    catch (err) {
        next(err);
    }
}));
router.get('/:cliente_id/comodato', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const cliente_id = req.params.cliente_id;
    try {
        // const comodato = await knex('ComodatosEnc')
        //   .where({ClienteID: cliente_id, Vigente: true})
        //   .first();
        //
        // if (comodato) {
        //   let items = await knex('ComodatosDet')
        //     .innerJoin('Envases', 'ComodatosDet.EnvaseID', 'Envases.EnvaseID')
        //     .where({ComodatoEncID: comodato.ComodatoEncID})
        //     .select('EnvaseCodigo', 'EnvaseNombre', 'Cantidad', 'Monto');
        //
        //   let lastComodato = {
        //     fecha: comodato.Fecha,
        //     comprobante: comodato.NroComprobante,
        //     items: camelizeKeys(items)
        //   }
        //
        //   res.status(200).json(lastComodato);
        // } else {
        //   res.status(404).json({error: 'El cliente no tiene comodatos.'});
        // }
        const items = yield connection_1.default('ComodatosMovimientos')
            .select('Envases.EnvaseCodigo', 'Envases.EnvaseNombre')
            .sum('Cantidad as Cantidad')
            .innerJoin('Envases', 'ComodatosMovimientos.envase_id', 'Envases.EnvaseID')
            .where({ cliente_id })
            .groupBy('Envases.EnvaseCodigo', 'Envases.EnvaseNombre');
        res.status(200).json(utils_1.camelizeKeys(items));
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=clientes.js.map