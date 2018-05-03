
exports.up = function(knex, Promise) {
    return knex.schema.table('room', function(t) {
        t.string('password')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('room', function(t) {
        t.dropColumn('password')
    })
};
