import knex from '../db/connection';

export default class RemitoService {
  public static async generarRemitosCrm(remitosCrm: Array<any>) {
    const remitos = [];

    try {
      const envases = await knex('Envases').select('*');
      for (let i = 0; i < remitosCrm.length; i++) {
        const remitoCrm = remitosCrm[i];
        let remito = {
          items: [],
          cliente: '',
          total: remitoCrm.Total,
          fecha: remitoCrm.Fecha,
          id: remitoCrm.RemitoID,
          nroRemito: this.formatNroRemito(remitoCrm.NroRemito),
        };

        const pedido = await knex('MovimientosEnc')
          .select('*')
          .where({MovimientoEncID: remitoCrm.MovimientoEncID})
          .first();
        console.log('pedido', pedido);
        remito.cliente = pedido.ClienteID;

        const items = await knex('MovimientosDet')
          .select('*')
          .where({MovimientoEncID: remitoCrm.MovimientoEncID});

        remito.items = items.map(item => {
          const envase = envases.find(envase => envase.EnvaseID === item.EnvaseID);
          return {
            cantidad: item.Cantidad,
            precio: item.Monto / item.Cantidad,
            articulo: envase ? envase.ID_ARTICULO_TANGO : item.EnvaseID
          }
        });

        remitos.push(remito);
      }

      return remitos;
    } catch (err) {
      console.log('err', err);
      throw err;
    }
  }

  private static formatNroRemito(nroRemito) {
    const splitNro = nroRemito.split('-');
    const sucursal = splitNro[0].padStart(5, '0');
    const comprobante = splitNro[1].padStart(8, '0');
    return `R${sucursal}${comprobante}`;
  }
}
