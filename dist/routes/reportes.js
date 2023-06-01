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
const router = express.Router();
router.get('/recuperados', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startActualDate = moment().startOf('month').format('YYYY-MM-DD');
        const endActualDate = moment().endOf('month').format('YYYY-MM-DD');
        const startAnteriorDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const endAnteriorDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        const clientesMesActual = yield (0, connection_1.default)('MovimientosEnc')
            .where({ EstadoMovimientoID: 3 })
            .whereBetween('Fecha', [startActualDate, endActualDate])
            .pluck('ClienteID')
            .distinct();
        const clientesMesAnterior = yield (0, connection_1.default)('MovimientosEnc')
            .where({ EstadoMovimientoID: 3 })
            .whereBetween('Fecha', [startAnteriorDate, endAnteriorDate])
            .pluck('ClienteID')
            .distinct();
        const clientesHistorico = yield (0, connection_1.default)('MovimientosEnc')
            .where({ EstadoMovimientoID: 3 })
            .whereNotBetween('Fecha', [startActualDate, endActualDate])
            .pluck('ClienteID')
            .distinct();
        const recuperadosIds = clientesMesActual.filter(c => !clientesMesAnterior.includes(c));
        const nuevosIds = recuperadosIds.filter(c => !clientesHistorico.includes(c));
        const recuperados = yield (0, connection_1.default)('Clientes')
            .select('Clientes.ClienteID as Id', 'Clientes.RazonSocial as Razon Social', 'Clientes.Calle as Calle', 'Clientes.Altura as Altura', 'Clientes.FechaUltimaCompra as Ultima Compra', 'Canales.CanalNombre as Canal', 'Zonas.ZonaNombre as Zona')
            .whereIn('ClienteID', recuperadosIds)
            .innerJoin('Canales', 'Canales.CanalID', 'Clientes.CanalID')
            .innerJoin('ZonasSub', 'ZonasSub.SubZonaID', 'Clientes.ZonaSubID')
            .innerJoin('Zonas', 'Zonas.ZonaID', 'ZonasSub.ZonaID');
        const clientes = recuperados.map(c => {
            return Object.assign(Object.assign({}, c), { Condicion: nuevosIds.includes(c.Id) ? 'nuevo' : 'recuperado' });
        });
        res.status(200).json(clientes);
    }
    catch (err) {
        next(err);
    }
}));
router.get('/comodatos_movimientos', helpers_1.default.ensureAuthenticated, helpers_1.default.ensureIsUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const movimientos = yield (0, connection_1.default)('ComodatosMovimientos')
            .select('Clientes.ClienteID as Cliente Id', 'Clientes.RazonSocial as Razon Social', 'ComodatosMovimientos.fecha as Fecha', 'ComodatosMovimientos.nro_comprobante as Comprobante', 'Envases.EnvaseNombre as Envase', 'ComodatosMovimientos.cantidad as Cantidad')
            .innerJoin('Clientes', 'Clientes.ClienteID', 'ComodatosMovimientos.cliente_id')
            .innerJoin('Envases', 'Envases.EnvaseID', 'ComodatosMovimientos.envase_id');
        res.status(200).json(movimientos);
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=reportes.js.map