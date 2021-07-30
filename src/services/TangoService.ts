import * as knex from 'knex';
import crmKnex from '../db/connection';

const TANGO_DB = process.env.TANGO_DB || 'mssql://sa:Axoft1988@centrocompartido.engux.com.ar:1550/ByB_Gestion';
const COD_PROVIN = process.env.COD_PROVIN || '1';

const tangoKnex = knex({
  client: 'mssql',
  connection: TANGO_DB,
  pool: {
    min: 2,
    max: 10
  }
});

export default class TangoService {
  public static async syncClientes(clientesCrm: Array<any>) {
    for (let i = 0; i < clientesCrm.length; i++) {
      const clienteCrm = clientesCrm[i];
      const clienteTango = this.crearClienteTango(clienteCrm);
      const lastIdDomicilioEntrega = await tangoKnex('DIRECCION_ENTREGA')
        .max('ID_DIRECCION_ENTREGA')
        .pluck('');
      const domicilioEntregaTango = this.crearDomicilioEntrega(clienteCrm, lastIdDomicilioEntrega[0] + 1);

      try {
        await tangoKnex.transaction(async trx => {
          await trx('GVA14').insert(clienteTango);
          await trx('DIRECCION_ENTREGA').insert(domicilioEntregaTango)
        });

        await crmKnex('Clientes').update({Sincronizado: 1}).where({ClienteID: clienteCrm.ClienteID});
      } catch (err) {
        console.log('err', err);
      }
    }
  }

  private static crearClienteTango(clienteCrm) {
    return {
      COD_CLIENT: clienteCrm.ClienteID,
      COD_PROVIN: COD_PROVIN,
      COD_ZONA: '1',
      COND_VTA: this.crearCondicionVenta(clienteCrm.CondicionVentaID),
      CUIT: clienteCrm.Cuit,
      DIR_COM: this.crearDireccion(clienteCrm.Altura, clienteCrm.Calle),
      DOMICILIO: this.crearDireccion(clienteCrm.Altura, clienteCrm.Calle),
      II_D: 'N',
      II_L: 'N',
      IVA_D: this.crearIvaD(clienteCrm.CondicionIvaID),
      IVA_L: 'S',
      LOCALIDAD: clienteCrm.Localidad,
      NOM_COM: clienteCrm.RazonSocial,
      RAZON_SOCI: clienteCrm.RazonSocial,
      SOBRE_II: 'N',
      SOBRE_IVA: 'N',
      TELEFONO_1: clienteCrm.Telefono,
      TIPO_DOC: this.crearTipoDocumento(clienteCrm.CondicionIvaID),
      COD_GVA14: clienteCrm.ClienteID,
      ID_CATEGORIA_IVA: this.crearCategoriaIva(clienteCrm.CondicionIvaID),
      ID_GVA14: clienteCrm.ClienteID
    };
  }

  private static crearDomicilioEntrega(clienteCrm, idDomicilioEntrega) {
    return {
      ID_DIRECCION_ENTREGA: idDomicilioEntrega,
      COD_DIRECCION_ENTREGA: 'PRINCIPAL',
      COD_CLIENTE: clienteCrm.ClienteID,
      DIRECCION: this.crearDireccion(clienteCrm.Altura, clienteCrm.Calle),
      LOCALIDAD: clienteCrm.Localidad,
      HABITUAL: 'S',
      TELEFONO1: clienteCrm.Telefono
    }
  }

  private static crearCondicionVenta(condicionVta) {
    switch (condicionVta) {
      case 1: // Contado
        return 1;
      default: // Condiciones de No Contado
        return 2
    }
  }

  private static crearDireccion(altura, calle) {
    return `${altura} ${calle}`;
  }

  private static crearIvaD(condicionIva) {
    switch (condicionIva) {
      case 1: // Consumidor Final
      case 3: // Responsable Monotributo
      case 4: // Responsable Exento
        return 'N';
      case 2: // Responsable Inscripto
        return 'S';
    }
  }

  private static crearTipoDocumento(condicionIva) {
    switch (condicionIva) {
      case 1: // Consumidor Final
        return 99;
      case 2: // Responsable Inscripto
      case 3: // Responsable Monotributo
      case 4: // Responsable Exento
        return 80;
    }
  }

  private static crearCategoriaIva(condicionIva) {
    switch (condicionIva) {
      case 1: // Consumidor Final
        return 2;
      case 2: // Responsable Inscripto
        return 1;
      case 3: // Responsable Monotributo
        return 4;
      case 4: // Responsable Exento
        return 5;
    }
  }
}
