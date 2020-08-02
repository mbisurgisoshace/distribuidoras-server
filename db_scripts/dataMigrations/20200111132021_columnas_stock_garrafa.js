exports.up = function(knex, Promise) {
    return knex.schema.table('ColumnasStock', table => {
        table.integer('stock');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('ColumnasStock', table => {
        table.dropColumn('stock');
    });
};
