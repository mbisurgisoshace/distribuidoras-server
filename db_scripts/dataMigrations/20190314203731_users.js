exports.up = function(knex, Promise) {
    return knex.schema.createTable('Users', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable();
        table.string('username').notNullable();
        table.string('password').notNullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('Users');
};
