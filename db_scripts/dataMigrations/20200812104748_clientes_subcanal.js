exports.up = function(knex, Promise) {
  return knex.schema.table('Clientes', table => {
    table.integer('SubcanalID').references('Subcanales.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('Clientes', table => {
    table.dropColumn('SubcanalID');
  });
};
