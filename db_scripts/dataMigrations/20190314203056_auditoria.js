exports.up = function(knex, Promise) {
	return knex.schema.createTable('Auditoria', (table) => {
        table.increments('id').primary();
        table.string('tabla').notNullable();
        table.string('accion').notNullable();
        table.string('usuario').notNullable();
        table.timestamp('fecha_accion').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('Auditoria');
};
