exports.up = function(knex, Promise) {
  return knex.schema.table('Clientes', table => {
    table.string('Motivo').defaultTo(null);
    table.dateTime('FechaMotivo');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('HojasRuta', table => {
    table.dropColumn('Motivo');
    table.dropColumn('FechaMotivo');
  });
};
