exports.up = function(knex, Promise) {
  return knex.schema.createTable('PedidosComercios', (table) => {
    table.increments('id').primary();
    table.dateTime('fecha');
    table.boolean('pagado');
    table.boolean('entregado').defaultTo(false);
    table.integer('comercio_id').references('Comercios.id');
    table.integer('movimiento_enc_id').references('MovimientosEnc.MovimientoEncID');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('PedidosComercios');
};
