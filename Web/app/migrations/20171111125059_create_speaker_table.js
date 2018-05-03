
exports.up = function(knex, Promise) {
    return knex.schema.createTable('speaker', function(t) {
        t.increments('id').primary()
        t.string('address').notNullable()
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('speaker')
};
