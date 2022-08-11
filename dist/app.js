"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("morgan");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const auth_1 = require("./routes/auth");
const stock_1 = require("./routes/stock");
const tango_1 = require("./routes/tango");
const hojas_1 = require("./routes/hojas");
const zonas_1 = require("./routes/zonas");
const cargas_1 = require("./routes/cargas");
const precios_1 = require("./routes/precios");
const envases_1 = require("./routes/envases");
const motivos_1 = require("./routes/motivos");
const canales_1 = require("./routes/canales");
const remitos_1 = require("./routes/remitos");
const reportes_1 = require("./routes/reportes");
const subzonas_1 = require("./routes/subzonas");
const clientes_1 = require("./routes/clientes");
const choferes_1 = require("./routes/choferes");
const camiones_1 = require("./routes/camiones");
const feriados_1 = require("./routes/feriados");
const comercios_1 = require("./routes/comercios");
const comodatos_1 = require("./routes/comodatos");
const objetivos_1 = require("./routes/objetivos");
const plantillas_1 = require("./routes/plantillas");
const movimientos_1 = require("./routes/movimientos");
const tiposEnvase_1 = require("./routes/tiposEnvase");
const estadosEnvase_1 = require("./routes/estadosEnvase");
const condicionesIva_1 = require("./routes/condicionesIva");
const tiposMovimiento_1 = require("./routes/tiposMovimiento");
const condicionesVenta_1 = require("./routes/condicionesVenta");
const estadosMovimiento_1 = require("./routes/estadosMovimiento");
class App {
    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
        this.errors();
    }
    middleware() {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(passport.initialize());
        this.express.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials, Accept-Encoding');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
    }
    routes() {
        this.express.use('/auth', auth_1.default);
        this.express.use('/stock', stock_1.default);
        this.express.use('/hojas', hojas_1.default);
        this.express.use('/zonas', zonas_1.default);
        this.express.use('/tango', tango_1.default);
        this.express.use('/cargas', cargas_1.default);
        this.express.use('/precios', precios_1.default);
        this.express.use('/envases', envases_1.default);
        this.express.use('/motivos', motivos_1.default);
        this.express.use('/canales', canales_1.default);
        this.express.use('/remitos', remitos_1.default);
        this.express.use('/reportes', reportes_1.default);
        this.express.use('/subzonas', subzonas_1.default);
        this.express.use('/clientes', clientes_1.default);
        this.express.use('/choferes', choferes_1.default);
        this.express.use('/camiones', camiones_1.default);
        this.express.use('/feriados', feriados_1.default);
        this.express.use('/comercios', comercios_1.default);
        this.express.use('/comodatos', comodatos_1.default);
        this.express.use('/objetivos', objetivos_1.default);
        this.express.use('/plantillas', plantillas_1.default);
        this.express.use('/tiposEnvase', tiposEnvase_1.default);
        this.express.use('/movimientos', movimientos_1.default);
        this.express.use('/estadosEnvase', estadosEnvase_1.default);
        this.express.use('/condicionesIva', condicionesIva_1.default);
        this.express.use('/tiposMovimiento', tiposMovimiento_1.default);
        this.express.use('/condicionesVenta', condicionesVenta_1.default);
        this.express.use('/estadosMovimiento', estadosMovimiento_1.default);
    }
    errors() {
        this.express.use((err, req, res, next) => {
            console.log('Send email with the error');
            next(err);
        });
        this.express.use((err, req, res, next) => {
            console.log('err', err);
            res.status(500).send({ err: err.stack, message: err.message });
        });
    }
}
exports.default = new App().express;
//# sourceMappingURL=app.js.map