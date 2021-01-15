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
        const comodato = yield connection_1.default('ComodatosEnc')
            .where({ ClienteID: cliente_id, Vigente: true })
            .first();
        if (comodato) {
            let items = yield connection_1.default('ComodatosDet')
                .innerJoin('Envases', 'ComodatosDet.EnvaseID', 'Envases.EnvaseID')
                .where({ ComodatoEncID: comodato.ComodatoEncID })
                .select('EnvaseCodigo', 'EnvaseNombre', 'Cantidad', 'Monto');
            let lastComodato = {
                fecha: comodato.Fecha,
                comprobante: comodato.NroComprobante,
                items: utils_1.camelizeKeys(items)
            };
            res.status(200).json(lastComodato);
        }
        else {
            res.status(404).json({ error: 'El cliente no tiene comodatos.' });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=clientes.js.map