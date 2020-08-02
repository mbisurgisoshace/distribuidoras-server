import * as knex from 'knex';

const config = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'local';

export default knex(config[environment]);
export function knexForEnv(env: string) {
	return knex(config[env]);
}
