import * as moment from 'moment';
import * as express from 'express';
import { v4 as uuidv4 } from 'uuid';

import knex from '../db/connection';
import authHelpers from '../auth/helpers';
import { camelizeKeys, formatKeys } from '../utils/utils';

const router = express.Router();

router.get('/motivos', async (req, res, next) => {
  try {
    const motivos = await knex('Motivos').select('*');
    res.status(200).json(camelizeKeys(motivos));
  } catch (err) {
    next(err);
  }
});

router.get('/productos', async (req, res, next) => {
  try {
    const envases = await knex('Envases').select('*');
    res.status(200).json(camelizeKeys(envases));
  } catch (err) {
    next(err);
  }
});

router.get('/:choferId/pedidos', async (req, res, next) => {
  const choferId = req.params.choferId;
  const today = moment().format('YYYY-MM-DD');

  try {
    const hoja = await knex('HojasRuta')
      .select('*')
      .where({ ChoferID: choferId, Fecha: today })
      .first();

    const pedidos = await knex('MovimientosEnc')
      .select(
        'MovimientosEnc.*',
        'CondicionesVenta.CondicionVentaNombre',
        'MovimientosEstado.EstadoMovimientoNombre'
      )
      .innerJoin(
        'MovimientosEstado',
        'MovimientosEnc.EstadoMovimientoID',
        'MovimientosEstado.EstadoMovimientoID'
      )
      .innerJoin(
        'CondicionesVenta',
        'MovimientosEnc.CondicionVentaID',
        'CondicionesVenta.CondicionVentaID'
      )
      .where({ HojaRutaID: hoja.HojaRutaID });

    const itemsPedido = await knex('MovimientosDet').whereIn(
      'MovimientoEncID',
      pedidos.map((pedido) => pedido.MovimientoEncID)
    );

    const clientes = await knex('Clientes')
      .select('*')
      .whereIn(
        'ClienteID',
        pedidos.map((p) => p.ClienteID)
      );

    const precios = await knex('ListasPrecio')
      .select('ListasPrecioDet.*')
      .innerJoin('ListasPrecioDet', 'ListasPrecio.ListaPrecioID', 'ListasPrecioDet.ListaPrecioID')
      .whereIn(
        'ListasPrecio.ListaPrecioID',
        clientes.map((c) => c.ListaPrecioID)
      );

    const pedidosFormateados = pedidos.map((pedido) => {
      const items = itemsPedido.filter((item) => item.MovimientoEncID === pedido.MovimientoEncID);
      const cliente = clientes.find((c) => c.ClienteID === pedido.ClienteID);
      const preciosCliente = precios.filter((p) => p.ListaPrecioID === cliente.ListaPrecioID);

      return {
        id: pedido.MovimientoEncID,
        cliente: {
          id: cliente.ClienteID,
          telefono: cliente.telefono,
          codigoCliente: cliente.ClienteID.toString(),
          razonSocial: cliente.RazonSocial,
          direccion: `${cliente.Calle} ${cliente.Altura}`,
          precios: preciosCliente.map((precio) => ({
            idProducto: precio.EnvaseID,
            precio: precio.Precio,
          })),
        },
        idCondicionVenta: pedido.CondicionVentaID,
        condicionVenta: pedido.CondicionVentaNombre,
        idEstado: pedido.EstadoMovimientoID,
        idMotivo: pedido.MotivoID,
        estado: getEstadoPedido(pedido.EstadoMovimientoNombre),
        items: items.map((item) => ({
          id: uuidv4(),
          idProducto: item.EnvaseID,
          cantidad: item.Cantidad,
          precio: parseFloat((item.Monto / item.Cantidad).toFixed(2)),
        })),
        visito: pedido.Visito,
        vendio: pedido.Vendio,
        reclamo: pedido.Reclamo,
        orden: pedido.Orden,
        observaciones: pedido.Observaciones,
        sincronizado: pedido.Sincronizado,
      };
    });

    res.status(200).json(pedidosFormateados);
  } catch (err) {
    next(err);
  }
});

const getEstadoPedido = (estado: string) => {
  if (estado === 'Entregado') return 'Entregado';
  if (estado === 'No Entregado') return 'No Entregado';
  return 'Pendiente';
};

export default router;
