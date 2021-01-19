exports.up = function(knex, Promise) {
  return knex.schema.createTable('ComodatosMovimientos', (table) => {
    table.increments('id').primary();
    table.dateTime('fecha');
    table.integer('comodato_enc_id').references('ComodatosEnc.ComodatoEncID');
    table.integer('envase_id').references('Envases.EnvaseID');
    table.integer('cantidad').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('ComodatosMovimientos');
};
