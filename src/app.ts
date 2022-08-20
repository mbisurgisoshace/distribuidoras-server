import * as logger from 'morgan';
import * as express from 'express';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';

import knex from './db/connection';
import auth from './routes/auth';
import stock from './routes/stock';
import tango from './routes/tango';
import hojas from './routes/hojas';
import zonas from './routes/zonas';
import tablas from './routes/tablas';
import cargas from './routes/cargas';
import precios from './routes/precios';
import envases from './routes/envases';
import motivos from './routes/motivos';
import canales from './routes/canales';
import remitos from './routes/remitos';
import reportes from './routes/reportes';
import subzonas from './routes/subzonas';
import clientes from './routes/clientes';
import choferes from './routes/choferes';
import camiones from './routes/camiones';
import feriados from './routes/feriados';
import comercios from './routes/comercios';
import comodatos from './routes/comodatos';
import objetivos from './routes/objetivos';
import plantillas from './routes/plantillas';
import movimientos from './routes/movimientos';
import tiposEnvase from './routes/tiposEnvase';
import estadosEnvase from './routes/estadosEnvase';
import condicionesIva from './routes/condicionesIva';
import tiposMovimiento from './routes/tiposMovimiento';
import condicionesVenta from './routes/condicionesVenta';
import estadosMovimiento from './routes/estadosMovimiento';

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.errors();
  }

  private middleware(): void {
    this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(passport.initialize());
    this.express.use(function (req: any, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials, Accept-Encoding'
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
  }

  private routes(): void {
    this.express.use('/auth', auth);
    this.express.use('/stock', stock);
    this.express.use('/hojas', hojas);
    this.express.use('/zonas', zonas);
    this.express.use('/tango', tango);
    this.express.use('/tablas', tablas);
    this.express.use('/cargas', cargas);
    this.express.use('/precios', precios);
    this.express.use('/envases', envases);
    this.express.use('/motivos', motivos);
    this.express.use('/canales', canales);
    this.express.use('/remitos', remitos);
    this.express.use('/reportes', reportes);
    this.express.use('/subzonas', subzonas);
    this.express.use('/clientes', clientes);
    this.express.use('/choferes', choferes);
    this.express.use('/camiones', camiones);
    this.express.use('/feriados', feriados);
    this.express.use('/comercios', comercios);
    this.express.use('/comodatos', comodatos);
    this.express.use('/objetivos', objetivos);
    this.express.use('/plantillas', plantillas);
    this.express.use('/tiposEnvase', tiposEnvase);
    this.express.use('/movimientos', movimientos);
    this.express.use('/estadosEnvase', estadosEnvase);
    this.express.use('/condicionesIva', condicionesIva);
    this.express.use('/tiposMovimiento', tiposMovimiento);
    this.express.use('/condicionesVenta', condicionesVenta);
    this.express.use('/estadosMovimiento', estadosMovimiento);
  }

  private errors(): void {
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

export default new App().express;
