exports.up = function(knex, Promise) {
  return knex.schema.createTable('ComodatosGestion', (table) => {
    table.increments('id').primary();
    table.dateTime('fecha');
    table.integer('comodato_enc_id').references('ComodatosEnc.ComodatoEncID');
    table.integer('chofer_id').references('Choferes.ChoferID');
    table.string('nro_comprobante');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('ComodatosGestion');
};
