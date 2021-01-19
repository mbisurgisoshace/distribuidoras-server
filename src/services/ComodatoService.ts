import * as R from 'ramda';

import knex from '../db/connection';

export default class ComodatoService {
  public static insertarComodato = async (comodatoEnc, comodatoDet) => {
    const comodato = (await knex('ComodatosEnc').insert(comodatoEnc, '*'))[0];
    comodatoDet.forEach(d => {
      d.ComodatoEncID = comodato.ComodatoEncID
    });

    comodato.items = await knex('ComodatosDet').insert(comodatoDet, '*');

    return comodato;
  }

  public static insertarMovimientos = async (enc, items, itemsRenovado) => {
    const groupItems = {};
    const groupItemsRenovado = {};

    items.forEach(i => {
      if (groupItems[i.envase_id]) {
        groupItems[i.envase_id] += i.cantidad;
      } else {
        groupItems[i.envase_id] = i.cantidad;
      }
    });

    itemsRenovado.forEach(i => {
      if (groupItemsRenovado[i.envase_id]) {
        groupItemsRenovado[i.envase_id] += i.cantidad;
      } else {
        groupItemsRenovado[i.envase_id] = i.cantidad;
      }
    });

    const movimientos = [];

    Object.keys(groupItems).forEach(k => {
      let newValue = groupItems[k];
      let oldValue = 0;

      if (groupItemsRenovado[k]) {
        oldValue = groupItemsRenovado[k];
      }

      movimientos.push({
        envase_id: k,
        cantidad: newValue - oldValue,
        cliente_id: enc.cliente_id,
        fecha: enc.fecha,
        comodato_enc_id: enc.comodato_enc_id,
        nro_comprobante: enc.nro_comprobante
      });
    });

    const difference = R.omit(Object.keys(groupItems), groupItemsRenovado);

    Object.keys(difference).forEach(k => {
      let newValue = 0;
      let oldValue = difference[k];

      movimientos.push({
        envase_id: k,
        cantidad: newValue - oldValue,
        cliente_id: enc.cliente_id,
        fecha: enc.fecha,
        comodato_enc_id: enc.comodato_enc_id,
        nro_comprobante: enc.nro_comprobante
      });
    });

    await knex('ComodatosMovimientos').insert(movimientos, '*');
  }
}
