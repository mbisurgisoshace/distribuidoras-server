const path = require('path');
const dbs = require('./config/database');

module.exports = {
	test: {
		client: 'mssql',
		connection: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL || dbs.db_test,
		pool: {
			min: 2,
			max: 10
		}
	},
	local: {
		client: 'mssql',
		connection: process.env.DATABASE_URL || dbs.db_local,
		pool: {
			min: 2,
			max: 10
		}
	},
	production: {
		client: 'mssql',
		connection: process.env.DATABASE_URL || dbs.db_prod,
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: path.resolve(__dirname, '../db_scripts/dataMigrations')
		}
	},
	development: {
		client: 'mssql',
		connection: process.env.DATABASE_URL || dbs.db_dev,
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: path.resolve(__dirname, '../db_scripts/dataMigrations')
		}
	}
};
