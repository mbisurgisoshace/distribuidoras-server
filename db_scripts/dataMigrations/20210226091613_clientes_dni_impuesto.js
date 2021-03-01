exports.up = function(knex, Promise) {
  return knex.schema.table('Clientes', table => {
    table.boolean('PresentoDocumento').defaultTo(false);
    table.boolean('PresentoImpuesto').defaultTo(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('Clientes', table => {
    table.dropColumn('PresentoDocumento');
    table.dropColumn('PresentoImpuesto');
  });
};
