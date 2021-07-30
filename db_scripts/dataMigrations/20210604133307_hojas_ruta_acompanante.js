exports.up = function(knex, Promise) {
  return knex.schema.table('HojasRuta', table => {
    table.integer('AcompananteID').references('Choferes.ChoferID');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('HojasRuta', table => {
    table.dropColumn('AcompananteID');
  });
};
