import * as moment from 'moment';
import knex from '../db/connection';

import { formatKeys } from '../utils/utils';
import { omit } from 'ramda';
export default class PedidoService {
  public static insertarPedido = async (pedido) => {
    let pedidoId = null;
    const pedidoEnc = omit(['items'], pedido);
    pedidoEnc.fecha = moment(pedidoEnc.fecha, 'DD-MM-YYYY').format('YYYY-MM-DD')
    const pedidoDet = pedido.items.map(item => formatKeys(omit(['precio'], item)));
    console.log('enc', pedidoEnc);
    console.log('det', pedidoDet);
    await knex.transaction(async (trx) => {
      const newPedidoEnc = (await knex('MovimientosEnc').insert(pedidoEnc, '*'))[0];
      pedidoId = newPedidoEnc.MovimientoEncID;
      pedidoDet.forEach(item => {
        item.movimientoencid = pedidoId;
      });

      await knex('MovimientosDet').insert(pedidoDet, '*');
    });

    return pedidoId;
  }

}