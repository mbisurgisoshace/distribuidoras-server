exports.up = function(knex, Promise) {
    return knex.schema.table('Zonas', table => {
        table.json('limites');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('Zonas', table => {
        table.dropColumn('limites');
    });
};
