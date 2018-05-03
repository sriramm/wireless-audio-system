
exports.up = function(knex, Promise) {
    return knex.schema.createTable('song', function(t) {
        t.increments('id').primary()
        t.json('data').notNullable()
        t.integer('room_id').unsigned().references('id').inTable('room')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('song')
};
