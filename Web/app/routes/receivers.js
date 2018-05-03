var knex = require('knex')(require('../knexfile'));
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    knex.select().table('speaker').then(function(speakers) {
        res.send(speakers);
    });
});

router.get('/free', function(req, res, next) {
    knex.select().table('speaker').whereNotExists(function() {
        this.select('*').from('speaker_room').whereRaw('speaker.id = speaker_room.speaker_id');
    }).then(function(speakers) {
        res.send(speakers);
    });
});

router.post('/', function(req, res, next) {
    var address = req.body.address;
    
    knex('speaker').insert({
        address: address
    }).then(function() { 
        res.sendStatus(200);
    }).catch( function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

router.delete('/', function(req, res, next) {
    var address = req.body.address;
    
    knex('speaker').select().where('address', address)
    .then(function(ids) {
        if(ids.length == 0) {
            res.sendStatus(404);
            return;
        }
        var id = ids[0].id;
        return knex('speaker_room').where('speaker_id', id).del();
    }).then(function() {
        return knex('speaker').where('address', address).del();
    }).then(function() { 
        res.sendStatus(200);
    }).catch(function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

module.exports = router
