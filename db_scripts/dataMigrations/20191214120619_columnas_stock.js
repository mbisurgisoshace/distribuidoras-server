exports.up = function(knex, Promise) {
    return knex.schema.createTable('ColumnasStock', (table) => {
        table.increments('id').primary();
        table.string('label').notNullable();
        table.string('articulos').notNullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('ColumnasStock');
};
