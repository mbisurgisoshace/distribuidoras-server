exports.up = function(knex, Promise) {
  return knex.schema.createTable('CuentaCorrienteComercios', (table) => {
    table.increments('id').primary();
    table.string('tipo');
    table.dateTime('fecha');
    table.integer('monto');
    table.string('comprobante');
    table.integer('comercio_id').references('Comercios.id');
    table.integer('pedido_id').references('PedidosComercios.id');
    table.boolean('cancelado').defaultTo(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('CuentaCorrienteComercios');
};
