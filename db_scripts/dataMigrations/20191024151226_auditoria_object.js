exports.up = function(knex, Promise) {
    return knex.schema.table('Auditoria', table => {
        table.json('object').notNullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('Auditoria', table => {
        table.dropColumn('object');
    });
};
