exports.up = function(knex, Promise) {
  return knex.schema.table('ComodatosMovimientos', table => {
    table.integer('cliente_id').references('Clientes.ClienteID');
    table.string('nro_comprobante');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('ComodatosMovimientos', table => {
    table.dropColumn('cliente_id');
    table.dropColumn('nro_comprobante');
  });
};
