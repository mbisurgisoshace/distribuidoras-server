exports.up = function(knex, Promise) {
  return knex.schema.table('ComodatosEnc', table => {
    table.string('Tipo').defaultTo('comodato');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('ComodatosEnc', table => {
    table.dropColumn('Tipo');
  });
};
