exports.up = function(knex, Promise) {
    return knex.schema.table('Users', table => {
        table.string('rol').notNullable().default('user');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('Users', table => {
        table.dropColumn('rol');
    });
};
