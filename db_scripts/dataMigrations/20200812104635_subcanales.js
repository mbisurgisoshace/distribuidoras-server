exports.up = function(knex, Promise) {
  return knex.schema.createTable('Subcanales', (table) => {
    table.increments('id').primary();
    table.string('subcanal');
    table.integer('canal_id').references('Canales.CanalID');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Subcanales');
};
