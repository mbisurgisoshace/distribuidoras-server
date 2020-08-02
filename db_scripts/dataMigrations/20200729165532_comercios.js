exports.up = function(knex, Promise) {
  return knex.schema.createTable('Comercios', (table) => {
    table.increments('id').primary();
    table.string('razon_social');
    table.string('telefono');
    table.string('email');
    table.string('calle');
    table.string('altura');
    table.string('entre');
    table.string('y');
    table.string('piso');
    table.string('depto');
    table.string('localidad');
    table.string('codigo_postal');
    table.decimal('latitud', 8);
    table.decimal('longitud', 8);
    table.string('observaciones');
    table.string('cuit');
    table.integer('zona_sub_id').references('ZonasSub.SubZonaID');
    table.integer('condicion_iva_id').references('CondicionesIva.CondicionIvaID');
    table.boolean('estado');
    table.string('username');
    table.string('password');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Comercios');
};
