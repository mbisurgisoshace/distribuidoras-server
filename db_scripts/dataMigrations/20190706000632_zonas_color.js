exports.up = function(knex, Promise) {
    return knex.schema.table('Zonas', table => {
        table.string('color');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('Zonas', table => {
        table.dropColumn('color');
    });
};
