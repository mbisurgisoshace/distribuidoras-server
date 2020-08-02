import knex from '../db/connection';

type Accion = 'insert' | 'update' | 'delete';

export default class AuditoriaService {
	public static log = async (tabla: string, id_tabla: number, object: any, accion: Accion, usuario: string) => {
		const log = await knex('Auditoria').insert({ tabla, id_tabla, object, accion, usuario }, '*');

		return log;
	};
}
