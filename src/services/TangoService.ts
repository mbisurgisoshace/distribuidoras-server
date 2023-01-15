import * as knex from 'knex';
import * as moment from 'moment';
import crmKnex from '../db/connection';
import * as process from 'process';

const TALONARIO_REMITOS = process.env.TALONARIO_REMITOS || '2';
const TANGO_DB =
  process.env.TANGO_DB || 'mssql://sa:Axoft1988@centrocompartido.engux.com.ar:1550/ByB_Gestion';
//const TANGO_DB = process.env.TANGO_DB || 'mssql://sa:Axoft1988@centrocompartido.engux.com.ar:1550/Mediterranea_de_Gas_Gestion';
const COD_PROVIN = process.env.COD_PROVIN || '01';
const ID_GVA_18 = process.env.ID_GVA_18 || '2';

const tangoKnex = knex({
  client: 'mssql',
  connection: TANGO_DB,
  pool: {
    min: 2,
    max: 10,
  },
});

export default class TangoService {
  public static async syncClientes(clientesCrm: Array<any>) {
    for (let i = 0; i < clientesCrm.length; i++) {
      const clienteCrm = clientesCrm[i];
      const clienteTangoId = await this.getProximoIdClienteTango();
      const clienteTango = this.crearClienteTango(clienteCrm, clienteTangoId);
      console.log('clienteTango', clienteTango);
      console.log('clienteTangoId', clienteTangoId);
      try {
        await tangoKnex.transaction(async (trx) => {
          await trx('GVA14').insert(clienteTango);

          const proximoIdEntrega = await this.getProximoIdDireccionEntrega();
          console.log('proximoIdEntrega', proximoIdEntrega);
          const domicilioEntregaTango = this.crearDomicilioEntrega(
            clienteTangoId,
            clienteCrm,
            proximoIdEntrega
          );
          console.log('domicilioEntregaTango', domicilioEntregaTango);
          await trx('DIRECCION_ENTREGA').insert(domicilioEntregaTango);
        });

        await crmKnex('Clientes')
          .update({ Sincronizado: 1 })
          .where({ ClienteID: clienteCrm.ClienteID });
      } catch (err) {
        console.log('err', err);
        throw err;
      }
    }
  }

  public static async syncRemitos(remitosCrm: Array<any>) {
    try {
      for (let i = 0; i < remitosCrm.length; i++) {
        const remitoCrm = remitosCrm[i];
        console.log('remitoCrm', remitoCrm);
        const remitoTangoExist = await tangoKnex('STA14')
          .select('*')
          .where({ N_REMITO: remitoCrm.nroRemito })
          .first();
        console.log('remitoTangoExist', remitoTangoExist);
        if (remitoTangoExist) continue;

        const proximoInterno = await this.getProximoNroInterno();
        const direccionEntrega = await this.getDireccionEntrega(remitoCrm.cliente);
        const remitoTangoEnc = {
          COD_PRO_CL: remitoCrm.cliente,
          ESTADO_MOV: 'P',
          FECHA_MOV: moment(remitoCrm.fecha).format('YYYY-MM-DD'),
          MON_CTE: true,
          N_COMP: remitoCrm.nroRemito,
          N_REMITO: remitoCrm.nroRemito,
          NCOMP_IN_S: proximoInterno,
          T_COMP: 'REM',
          TALONARIO: parseInt(TALONARIO_REMITOS),
          TCOMP_IN_S: 'RE',
          COD_TRANSP: '2',
          ID_DIRECCION_ENTREGA: direccionEntrega,
        };
        console.log('remitoTangoEnc', remitoTangoEnc);
        let renglon = 0;

        const items = remitoCrm.items.map((item) => {
          renglon++;

          return {
            CAN_EQUI_V: 1,
            CANT_PEND: item.cantidad,
            CANTIDAD: item.cantidad,
            COD_ARTICU: item.articulo,
            COD_DEPOSI: '1',
            EQUIVALENC: 1,
            FECHA_MOV: moment(remitoCrm.fecha).format('YYYY-MM-DD'),
            N_RENGL_S: renglon,
            NCOMP_IN_S: proximoInterno,
            PRECIO: item.precio,
            PRECIO_REM: remitoCrm.total,
            TCOMP_IN_S: 'RE',
            TIPO_MOV: 'S',
            UNIDAD_MEDIDA_SELECCIONADA: 'P',
          };
        });
        console.log('items', items);
        await tangoKnex.transaction(async (trx) => {
          await trx('STA14').insert(remitoTangoEnc);

          await trx('STA20').insert(items);

          await crmKnex('Remitos').update({ Sincronizado: 1 }).where({ RemitoID: remitoCrm.id });
        });
      }
    } catch (err) {
      console.log('err', err);
    }
  }

  public static async getVentaFacturada(desde, hasta) {
    try {
      const facturacion = await tangoKnex('GVA53')
        .select('*')
        .whereBetween('FECHA_MOV', [desde, hasta])
        .andWhere({ TCOMP_IN_V: 'FC' });

      return facturacion;
    } catch (err) {
      console.log('err', err);
    }
  }

  public static async getRemitosPendientes(desde, hasta) {
    try {
      const remitosPendientes = await tangoKnex('STA20')
        .whereBetween('FECHA_MOV', [desde, hasta])
        .andWhere({ TCOMP_IN_S: 'RE' });

      return remitosPendientes;
    } catch (err) {
      console.log('err', err);
    }
  }

  private static crearClienteTango(clienteCrm, clienteTangoId) {
    return {
      COD_CLIENT: clienteCrm.ClienteID,
      COD_PROVIN: COD_PROVIN,
      COD_ZONA: '1',
      COND_VTA: this.crearCondicionVenta(clienteCrm.CondicionVentaID),
      CUIT: clienteCrm.Cuit,
      //DIR_COM: this.crearDireccion(clienteCrm.Altura, clienteCrm.Calle),
      //DOMICILIO: this.crearDireccion(clienteCrm.Altura, clienteCrm.Calle),
      DIR_COM: 'Direccion',
      DOMICILIO: 'Direccion',
      II_D: 'N',
      II_L: 'N',
      IVA_D: this.crearIvaD(clienteCrm.CondicionIvaID),
      IVA_L: 'S',
      //LOCALIDAD: clienteCrm.Localidad,
      LOCALIDAD: 'Localidad',
      NOM_COM: clienteCrm.RazonSocial,
      RAZON_SOCI: clienteCrm.RazonSocial,
      SOBRE_II: 'N',
      SOBRE_IVA: 'N',
      TELEFONO_1: clienteCrm.Telefono,
      TIPO_DOC: this.crearTipoDocumento(clienteCrm.CondicionIvaID),
      COD_GVA14: clienteCrm.ClienteID,
      ID_CATEGORIA_IVA: this.crearCategoriaIva(clienteCrm.CondicionIvaID),
      ID_GVA14: clienteTangoId,
      ID_GVA18: parseInt(ID_GVA_18),
    };
  }

  private static crearDomicilioEntrega(clienteTangoId, clienteCrm, idDomicilioEntrega) {
    return {
      ID_DIRECCION_ENTREGA: idDomicilioEntrega,
      COD_DIRECCION_ENTREGA: 'PRINCIPAL',
      COD_CLIENTE: clienteCrm.ClienteID,
      //DIRECCION: this.crearDireccion(clienteCrm.Altura, clienteCrm.Calle),
      //LOCALIDAD: clienteCrm.Localidad,
      DIRECCION: 'Direccion',
      LOCALIDAD: 'Localidad',
      HABITUAL: 'S',
      HABILITADO: 'S',
      TELEFONO1: clienteCrm.Telefono,
      ID_GVA14: clienteTangoId,
      ID_GVA18: parseInt(ID_GVA_18),
    };
  }

  private static crearCondicionVenta(condicionVta) {
    switch (condicionVta) {
      case 1: // Contado
        return 1;
      default: // Condiciones de No Contado
        return 2;
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

  private static async getProximoNroInterno() {
    const ultimoInterno = await tangoKnex('STA14')
      .select('NCOMP_IN_S')
      .where({ TCOMP_IN_S: 'RE' })
      .orderBy('ID_STA14', 'desc')
      .first();
    console.log('ultimoInterno', ultimoInterno);
    const proximoInterno = parseInt(ultimoInterno.NCOMP_IN_S) + 1;
    console.log('proximoInterno', proximoInterno);
    return proximoInterno.toString().padStart(8, '0');
  }

  private static async getDireccionEntrega(clienteId) {
    const direccionEntrega = await tangoKnex('DIRECCION_ENTREGA')
      .select('ID_DIRECCION_ENTREGA')
      .where({ COD_CLIENTE: clienteId })
      .first();

    return direccionEntrega.ID_DIRECCION_ENTREGA;
  }

  private static async getProximoIdClienteTango() {
    const proximoId = await tangoKnex.raw('SELECT NEXT VALUE FOR sequence_gva14');
    return proximoId[0][''];
  }

  private static async getProximoIdDireccionEntrega() {
    const ultimoId = await tangoKnex('DIRECCION_ENTREGA')
      .select('ID_DIRECCION_ENTREGA')
      .orderBy('ID_DIRECCION_ENTREGA', 'desc')
      .first();

    return parseInt(ultimoId.ID_DIRECCION_ENTREGA) + 1;
  }
}
