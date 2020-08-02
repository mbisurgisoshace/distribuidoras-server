exports.up = function(knex, Promise) {
  return knex.schema.createTable('StockComercios', (table) => {
    table.increments('id').primary();
    table.string('tipo');
    table.dateTime('fecha');
    table.integer('cantidad');
    table.string('comprobante');
    table.integer('comercio_id').references('Comercios.id');
    table.integer('envase_id').references('Envases.EnvaseID');
    table.integer('movimiento_enc_id').references('MovimientosEnc.MovimientoEncID');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('StockComercios');
};
