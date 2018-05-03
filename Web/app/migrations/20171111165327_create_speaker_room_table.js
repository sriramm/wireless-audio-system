
exports.up = function(knex, Promise) {
    return knex.schema.createTable('speaker_room', function(t) {
        t.integer('speaker_id').unsigned().references('id').inTable('speaker')
        t.integer('room_id').unsigned().references('id').inTable('room')
        t.primary(['room_id', 'speaker_id'])
    })
    
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('speaker_room')
};
