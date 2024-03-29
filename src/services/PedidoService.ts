import * as moment from 'moment';
import knex from '../db/connection';

import { formatKeys } from '../utils/utils';
import { omit } from 'ramda';
export default class PedidoService {
  public static insertarPedido = async (pedido) => {
    let pedidoId = null;
    const pedidoEnc = omit(['items'], pedido);
    pedidoEnc.fecha = moment(pedidoEnc.fecha, 'DD-MM-YYYY').format('YYYY-MM-DD');
    pedidoEnc.observaciones = !pedidoEnc.observaciones ? null : pedidoEnc.observaciones;
    const pedidoDet = pedido.items.map((item) => formatKeys(omit(['precio'], item)));
    await knex.transaction(async (trx) => {
      const newPedidoEnc = (await knex('MovimientosEnc').insert(pedidoEnc, '*'))[0];
      pedidoId = newPedidoEnc.MovimientoEncID;
      pedidoDet.forEach((item) => {
        item.movimientoencid = pedidoId;
      });

      await knex('MovimientosDet').insert(pedidoDet, '*');

      if (pedidoEnc.estadomovimientoid === 3) {
        await trx('Clientes')
          .where({ ClienteID: pedidoEnc.clienteid })
          .update({ FechaUltimaCompra: pedidoEnc.fecha }, '*');
      }
    });

    return pedidoId;
  };

  public static updatePedido = async (pedidoId, pedido) => {
    const pedidoEnc = omit(['movimientoencid', 'items', 'createdat'], pedido);
    pedidoEnc.fecha = moment(pedidoEnc.fecha, 'DD-MM-YYYY').format('YYYY-MM-DD');
    pedidoEnc.observaciones = !pedidoEnc.observaciones ? null : pedidoEnc.observaciones;
    const pedidoDet = pedido.items.map((item) =>
      formatKeys(omit(['movimiento_det_id', 'precio'], item))
    );

    pedidoDet.forEach((item) => {
      item.movimientoencid = pedidoId;
    });

    await knex.transaction(async (trx) => {
      await trx('MovimientosEnc').where({ MovimientoEncID: pedidoId }).update(pedidoEnc, '*');

      await this.mergeItems(trx, pedidoId, pedidoDet);

      if (pedidoEnc.estadomovimientoid === 3) {
        await trx('Clientes')
          .where({ ClienteID: pedidoEnc.clienteid })
          .update({ FechaUltimaCompra: pedidoEnc.fecha }, '*');
      }
    });
  };

  private static mergeItems = async (trx, pedidoId, pedidoDet) => {
    await trx('MovimientosDet').where({ MovimientoEncID: pedidoId }).delete();

    for (let i = 0; i < pedidoDet.length; i++) {
      await trx('MovimientosDet').insert(pedidoDet[i], '*');
    }
  };
}
