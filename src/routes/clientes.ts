//@ts-nocheck

import * as express from 'express';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';
import AuditoriaService from '../services/AuditoriaService';
import * as moment from 'moment';

const router = express.Router();

router.get(
  '/',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const clientes = await knex('Clientes').select('*').where({ Estado: true });
      res.status(200).json(camelizeKeys(clientes));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/filter',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const { currentPage, pageSize, filterText } = req.body;
      const offset = (currentPage - 1) * pageSize;

      let clientes = [];
      let clientesCount = 0;

      if (filterText) {
        const query = knex('Clientes')
          .select('ClienteID')
          .whereRaw(`RazonSocial like '%${filterText}%'`)
          .orWhereRaw(`ClienteID like '%${filterText}%'`)
          .orWhereRaw(`Calle like '%${filterText}%'`)
          .orWhereRaw(`Altura like '%${filterText}%'`);

        const result = ((await query) || []).map((res: any) => res.ClienteID);

        clientes = await knex.raw(`
        WITH results AS (SELECT *, ROW_NUMBER() OVER (ORDER BY ClienteID) as RowNum FROM Clientes WHERE ClienteID in (${result}))
        SELECT * FROM results
        WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
      `);
        clientesCount = await knex('Clientes')
          .count('ClienteID', { as: 'count' })
          .whereIn('ClienteID', result);
      } else {
        clientes = await knex.raw(`
        WITH results AS (SELECT *, ROW_NUMBER() OVER (ORDER BY ClienteID) as RowNum FROM Clientes)
        SELECT * FROM results
        WHERE RowNum BETWEEN ${offset + 1} AND ${offset + pageSize}
      `);
        clientesCount = await knex('Clientes').count('ClienteID', { as: 'count' });
      }

      res.status(200).json({
        pageSize,
        currentPage,
        total: clientesCount[0][''],
        clientes: camelizeKeys(clientes),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/search',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const filters = req.body;

    try {
      // let query = knex('Clientes')
      //   .leftOuterJoin('Canales', 'Canales.CanalID', 'Clientes.CanalID')
      //   .leftOuterJoin('MovimientosEnc', 'MovimientosEnc.ClienteID', 'Clientes.ClienteID')
      //   //.leftOuterJoin('MovimientosDet', 'MovimientosDet.MovimientoEncID', 'MovimientosEnc.MovimientoEncID')
      //   .leftOuterJoin('ZonasSub', 'ZonasSub.SubZonaID', 'Clientes.ZonaSubID')
      //   .leftOuterJoin('Zonas', 'Zonas.ZonaID', 'ZonasSub.ZonaID')
      //   .distinct('Clientes.ClienteID')
      let query = knex('Clientes')
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

            this.andWhere('MovimientosEnc.Fecha', '>=', desde).andWhere(
              'MovimientosEnc.Fecha',
              '<=',
              hasta
            );
          } else {
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

      let innerResult = ((await query) || [])
        .map((res: any) => res.MovimientoEncID)
        .filter((val) => val);

      console.log('innerResult', innerResult);

      let query_comercial = knex('MovimientosEnc')
        .leftOuterJoin(
          'MovimientosDet',
          'MovimientosDet.MovimientoEncID',
          'MovimientosEnc.MovimientoEncID'
        )
        .leftOuterJoin('Envases', 'Envases.EnvaseID', 'MovimientosDet.EnvaseID')
        .whereIn('MovimientosEnc.MovimientoEncID', innerResult)
        .distinct('MovimientosEnc.ClienteID')
        .groupBy('MovimientosEnc.ClienteID');

      if (filters.tipo_producto) {
        query_comercial = knex('viewTotalesPorTipoEnvase').whereIn('MovimientoEncID', innerResult);

        if (
          filters.tipo_producto.butano &&
          (filters.tipo_producto.butano.min || filters.tipo_producto.butano.max)
        ) {
          query_comercial = query_comercial.andWhere(function () {
            this.andWhere('TipoEnvaseID', 1);

            if (filters.tipo_producto.butano.min && filters.tipo_producto.butano.max) {
              const min = filters.tipo_producto.butano.min;
              const max = filters.tipo_producto.butano.max;

              this.andWhere('TotalKilos', '>=', min).andWhere('TotalKilos', '<=', max);
            } else {
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

        if (
          filters.tipo_producto.propano &&
          (filters.tipo_producto.propano.min || filters.tipo_producto.propano.max)
        ) {
          query_comercial = query_comercial.andWhere(function () {
            this.andWhere('TipoEnvaseID', 2);

            if (filters.tipo_producto.propano.min && filters.tipo_producto.propano.max) {
              const min = filters.tipo_producto.propano.min;
              const max = filters.tipo_producto.propano.max;

              this.andWhere('TotalKilos', '>=', min).andWhere('TotalKilos', '<=', max);
            } else {
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

      let outerResult = ((await query_comercial) || [])
        .map((res: any) => res.ClienteID)
        .filter((val) => val);

      console.log('outerResult', outerResult);

      //const result = await knex('Clientes').whereIn('ClienteID', innerResult);
      const result = await knex('Clientes').whereIn('ClienteID', outerResult);

      res.send(camelizeKeys(result));
      //res.send(camelizeKeys([]));
    } catch (err) {
      console.log('err', err);
      res.send(camelizeKeys([]));
    }
  }
);

router.get(
  '/:cliente_id(\\d+)',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
      const cliente = await knex('Clientes').where({ ClienteID: cliente_id }).first();
      res.status(200).json(camelizeKeys(cliente));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/canal/:canal_id(\\d+)',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const canal_id = req.params.canal_id;

    try {
      const clientes = await knex('Clientes').where({ CanalID: canal_id });
      res.status(200).json(camelizeKeys(clientes));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/plantilla',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const { zonaId, diaSemana } = req.query;

    try {
      const zonasSub = await knex('ZonasSub').where({ ZonaID: zonaId }).select('*');

      const clientes = await knex('Plantillas')
        .innerJoin('Clientes', 'Clientes.ClienteID', 'Plantillas.ClienteID')
        .whereIn(
          'Clientes.ZonaSubID',
          zonasSub.map((zs) => zs.SubZonaID)
        )
        .andWhere('DiaSemana', diaSemana)
        .select('Clientes.*');
      res.status(200).json(camelizeKeys(clientes));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/last',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    try {
      const lastCodigo =
        (await knex('Clientes').first().orderBy('ClienteID', 'desc').pluck('ClienteID'))[0] + 1;
      res.status(200).json(lastCodigo);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:cliente_id(\\d+)/lastPedidos',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;
    try {
      const ultimosPedidos = await knex('MovimientosEnc')
        .limit(5)
        .sum('MovimientosDet.Monto as Total')
        .select(
          'MovimientosEnc.MovimientoEncID',
          'MovimientosEnc.Fecha',
          'MovimientosTipo.TipoMovimientoNombre',
          'CondicionesVenta.CondicionVentaNombre',
          'MovimientosDet.Monto'
        )
        .orderBy('Fecha', 'desc')
        .innerJoin(
          'MovimientosTipo',
          'MovimientosTipo.TipoMovimientoID',
          'MovimientosEnc.TipoMovimientoID'
        )
        .innerJoin(
          'CondicionesVenta',
          'CondicionesVenta.CondicionVentaID',
          'MovimientosEnc.CondicionVentaID'
        )
        .innerJoin(
          'MovimientosDet',
          'MovimientosDet.MovimientoEncID',
          'MovimientosEnc.MovimientoEncID'
        )
        .innerJoin('Envases', 'Envases.EnvaseID', 'MovimientosDet.EnvaseID')
        .where({ ClienteID: cliente_id, EstadoMovimientoID: 3 })
        .groupBy(
          'MovimientosEnc.MovimientoEncID',
          'MovimientosEnc.Fecha',
          'MovimientosTipo.TipoMovimientoNombre',
          'CondicionesVenta.CondicionVentaNombre',
          'MovimientosDet.Monto'
        );

      res.status(200).json(camelizeKeys(ultimosPedidos));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const values: any = formatKeys(req.body, 'cliente_id');
    values.Estado = true;

    try {
      const cliente = (
        await knex('Clientes').insert(values, '*', { includeTriggerModifications: true })
      )[0];
      AuditoriaService.log(
        'clientes',
        cliente.ClienteID,
        JSON.stringify(cliente),
        'insert',
        req.user.username
      );
      res.status(200).json(camelizeKeys(cliente));
    } catch (err) {
      console.log('err', err);
      next(err);
    }
  }
);

router.put(
  '/:cliente_id(\\d+)',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;
    const values: any = formatKeys(req.body, 'cliente_id');

    try {
      const cliente = await knex('Clientes').where({ ClienteID: cliente_id }).first();

      if (cliente) {
        const updatedCliente = (
          await knex('Clientes').where({ ClienteID: cliente_id }).update(values, '*')
        )[0];
        AuditoriaService.log(
          'clientes',
          updatedCliente.ClienteID,
          JSON.stringify(updatedCliente),
          'update',
          req.user.username
        );
        res.status(200).json(camelizeKeys(updatedCliente));
      } else {
        res.status(404).json({ error: `Cliente ID: ${cliente_id} no existe.` });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:cliente_id',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
      const deletedCliente = await knex('Clientes').where({ ClienteID: cliente_id }).delete();

      if (deletedCliente) {
        AuditoriaService.log(
          'clientes',
          deletedCliente.ClienteID,
          JSON.stringify(deletedCliente),
          'delete',
          req.user.username
        );
        res.status(200).json(`Cliente ID: ${cliente_id} eliminado satisfactoriamente`);
      } else {
        res.status(404).json({ error: `Cliente ID: ${cliente_id} no existe.` });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:cliente_id/last',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
    const cliente_id = req.params.cliente_id;

    try {
      const lastPedidoId = await knex('MovimientosEnc')
        .where({ ClienteID: cliente_id })
        .orderBy('fecha', 'desc')
        .first()
        .pluck('MovimientoEncID');

      if (lastPedidoId[0]) {
        let items = await knex('MovimientosEnc')
          .innerJoin(
            'MovimientosDet',
            'MovimientosEnc.MovimientoEncID',
            'MovimientosDet.MovimientoEncID'
          )
          .innerJoin('Envases', 'MovimientosDet.EnvaseID', 'Envases.EnvaseID')
          .where('MovimientosEnc.MovimientoEncID', lastPedidoId[0])
          .select('EnvaseCodigo', 'EnvaseNombre', 'Cantidad', 'Monto', 'Envases.EnvaseID');

        if (items && items.length > 0) {
          items = items.map((i) => {
            let precio = i.Monto / i.Cantidad;
            return {
              ...i,
              precio,
            };
          });
        }

        let lastPedido = {
          pedido_id: lastPedidoId[0],
          items: camelizeKeys(items),
        };

        res.status(200).json(lastPedido);
      } else {
        res.status(404).json({ error: 'El cliente no tiene pedidos.' });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:cliente_id/comodato',
  authHelpers.ensureAuthenticated,
  authHelpers.ensureIsUser,
  async (req, res, next) => {
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
      const items = await knex('ComodatosMovimientos')
        .select('Envases.EnvaseCodigo', 'Envases.EnvaseNombre')
        .sum('Cantidad as Cantidad')
        .innerJoin('Envases', 'ComodatosMovimientos.envase_id', 'Envases.EnvaseID')
        .where({ cliente_id })
        .groupBy('Envases.EnvaseCodigo', 'Envases.EnvaseNombre');

      res.status(200).json(camelizeKeys(items));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
