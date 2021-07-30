exports.up = function(knex, Promise) {
  return knex.schema.table('HojasRuta', table => {
    table.integer('Canjes').defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('HojasRuta', table => {
    table.dropColumn('Canjes');
  });
};
