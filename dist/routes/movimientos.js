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
const moment = require("moment");
const express = require("express");
const connection_1 = require("../db/connection");
const helpers_1 = require("../auth/helpers");
const utils_1 = require("../utils/utils");
const router = express.Router();
router.get('/:hoja_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const hoja_id = req.params.hoja_id;
    try {
        const movimientos = yield connection_1.default('MovimientosEnc').where({ HojaRutaID: hoja_id });
        yield Promise.all(movimientos.map((m) => __awaiter(this, void 0, void 0, function* () {
            const detalle = yield connection_1.default('MovimientosDet').where({ MovimientoEncID: m.MovimientoEncID });
            utils_1.camelizeKeys(detalle);
            m.items = utils_1.camelizeKeys(detalle);
        })));
        res.status(200).json(utils_1.camelizeKeys(movimientos));
    }
    catch (err) {
        next(err);
    }
}));
router.get('/movimiento/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const movimiento_enc_id = req.params.movimiento_enc_id;
    try {
        const movimiento = yield connection_1.default('MovimientosEnc').where({ MovimientoEncID: movimiento_enc_id }).first();
        console.log('movimiento_enc_id', movimiento_enc_id);
        console.log('movimiento', movimiento);
        const items = yield connection_1.default('MovimientosDet').where({ MovimientoEncID: movimiento.MovimientoEncID });
        movimiento.items = utils_1.camelizeKeys(items);
        res.status(200).json(utils_1.camelizeKeys(movimiento));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/search', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const filters = req.body;
    try {
        let query = connection_1.default('MovimientosEnc')
            .leftOuterJoin('HojasRuta', 'HojasRuta.HojaRutaID', 'MovimientosEnc.HojaRutaID')
            //.leftOuterJoin('Choferes', 'Choferes.ChoferID', 'HojasRuta.ChoferID')
            .leftOuterJoin('Clientes', 'Clientes.ClienteID', 'MovimientosEnc.ClienteID')
            .distinct('MovimientosEnc.MovimientoEncID')
            .orderBy('MovimientosEnc.MovimientoEncID');
        if (filters.desde && filters.hasta) {
            const desde = moment(filters.desde, 'DD-MM-YYYY').format('YYYY-MM-DD');
            const hasta = moment(filters.hasta, 'DD-MM-YYYY').format('YYYY-MM-DD');
            query = query.andWhere(function () {
                this
                    .andWhere('MovimientosEnc.Fecha', '>=', desde)
                    .andWhere('MovimientosEnc.Fecha', '<=', hasta);
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
            .filter(val => val);
        const result = yield connection_1.default('viewMonitor').whereIn('MovimientoEncID', innerResult);
        res.send(result);
    }
    catch (err) {
        next(err);
    }
}));
router.post('/', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const movimiento = (yield connection_1.default('MovimientosEnc').insert(values, '*'))[0];
        res.status(200).json(utils_1.camelizeKeys(movimiento));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.post('/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        const items = yield connection_1.default('MovimientosDet').insert(values, '*');
        res.status(200).json(utils_1.camelizeKeys(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/actualizacion_masiva', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = req.body;
    const ids = values.ids;
    const actualizaciones = utils_1.formatKeys(values.actualizaciones);
    console.log('ids', ids);
    console.log('actualizaciones', actualizaciones);
    try {
        yield connection_1.default('MovimientosEnc')
            .update(actualizaciones, '*')
            .whereIn('MovimientoEncID', ids);
        res.status(200).json('ok');
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const values = utils_1.formatKeys(req.body);
    try {
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v.movimientodetid) {
                const id = v.movimientodetid;
                const updateRow = utils_1.formatKeys(v, 'movimientodetid');
                yield connection_1.default('MovimientosDet').where({ MovimientoDetID: id }).update(updateRow, '*');
            }
            else {
                yield connection_1.default('MovimientosDet').insert(v, '*');
            }
        }
        const items = [];
        res.status(200).json(utils_1.camelizeKeys(items));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
router.put('/movimiento/:movimiento_enc_id', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const movimiento_enc_id = req.params.movimiento_enc_id;
    const values = utils_1.formatKeys(req.body);
    try {
        const movimiento = (yield connection_1.default('MovimientosEnc').where({ MovimientoEncID: movimiento_enc_id }).update(values, '*'))[0];
        res.status(200).json(utils_1.camelizeKeys(movimiento));
    }
    catch (err) {
        console.log('err', err);
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=movimientos.js.map