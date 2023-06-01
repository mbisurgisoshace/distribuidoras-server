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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../db/connection");
class ComodatoService {
}
exports.default = ComodatoService;
_a = ComodatoService;
ComodatoService.insertarComodato = (comodatoEnc, comodatoDet) => __awaiter(void 0, void 0, void 0, function* () {
    const comodato = (yield (0, connection_1.default)('ComodatosEnc').insert(comodatoEnc, '*'))[0];
    comodatoDet.forEach(d => {
        d.ComodatoEncID = comodato.ComodatoEncID;
    });
    comodato.items = yield (0, connection_1.default)('ComodatosDet').insert(comodatoDet, '*');
    return comodato;
});
// public static insertarMovimientos = async (enc, items, itemsRenovado) => {
//   const groupItems = {};
//   const groupItemsRenovado = {};
//
//   items.forEach(i => {
//     if (groupItems[i.envase_id]) {
//       groupItems[i.envase_id] += i.cantidad;
//     } else {
//       groupItems[i.envase_id] = i.cantidad;
//     }
//   });
//
//   itemsRenovado.forEach(i => {
//     if (groupItemsRenovado[i.envase_id]) {
//       groupItemsRenovado[i.envase_id] += i.cantidad;
//     } else {
//       groupItemsRenovado[i.envase_id] = i.cantidad;
//     }
//   });
//
//   const movimientos = [];
//
//   Object.keys(groupItems).forEach(k => {
//     let newValue = groupItems[k];
//     let oldValue = 0;
//
//     if (groupItemsRenovado[k]) {
//       oldValue = groupItemsRenovado[k];
//     }
//
//     movimientos.push({
//       envase_id: k,
//       cantidad: newValue - oldValue,
//       cliente_id: enc.cliente_id,
//       fecha: enc.fecha,
//       comodato_enc_id: enc.comodato_enc_id,
//       nro_comprobante: enc.nro_comprobante
//     });
//   });
//
//   const difference = R.omit(Object.keys(groupItems), groupItemsRenovado);
//
//   Object.keys(difference).forEach(k => {
//     let newValue = 0;
//     let oldValue = difference[k];
//
//     movimientos.push({
//       envase_id: k,
//       cantidad: newValue - oldValue,
//       cliente_id: enc.cliente_id,
//       fecha: enc.fecha,
//       comodato_enc_id: enc.comodato_enc_id,
//       nro_comprobante: enc.nro_comprobante
//     });
//   });
//
//   await knex('ComodatosMovimientos').insert(movimientos, '*');
// }
ComodatoService.insertarMovimientos = (enc, items) => __awaiter(void 0, void 0, void 0, function* () {
    const groupItems = {};
    items.forEach(i => {
        if (groupItems[i.envase_id]) {
            groupItems[i.envase_id] += i.cantidad;
        }
        else {
            groupItems[i.envase_id] = i.cantidad;
        }
    });
    const movimientos = [];
    Object.keys(groupItems).forEach(k => {
        movimientos.push({
            envase_id: k,
            cantidad: groupItems[k],
            cliente_id: enc.cliente_id,
            fecha: enc.fecha,
            comodato_enc_id: enc.comodato_enc_id,
            nro_comprobante: enc.nro_comprobante
        });
    });
    yield (0, connection_1.default)('ComodatosMovimientos').insert(movimientos, '*');
});
//# sourceMappingURL=ComodatoService.js.map