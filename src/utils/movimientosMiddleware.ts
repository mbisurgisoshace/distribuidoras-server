import knex from '../db/connection';
import { formatKeys } from './utils';

export async function shouldAllowUpdate(req, res, next) {
  const values: any = formatKeys(req.body);
  const hojaRutaId = values.hojarutaid;

  const hoja = await knex('HojasRuta').where({ hojaRutaId });

  if (hoja && !hoja.estado) {
    return res
      .status(500)
      .send('No se puede modificar o agregar el pedido porque la hoja de ruta esta cerrada');
  }

  next();
}
