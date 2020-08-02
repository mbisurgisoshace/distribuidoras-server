exports.up = function(knex, Promise) {
    return knex.schema.table('Auditoria', table => {
        table.integer('id_tabla').notNullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('Auditoria', table => {
        table.dropColumn('id_tabla');
    });
};
