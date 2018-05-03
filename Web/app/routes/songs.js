var knex = require('knex')(require('../knexfile'));
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    var roomId = req.query.room_id;

    knex.select().table('song').where('room_id', roomId)
        .then(function(songs) {
            res.send(songs[0]);
    }).catch( function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

router.post('/', function(req, res, next) { // unused
    var data = req.body.data;
    var roomId = req.body.room_id;
    
    knex('song').insert({
        data: data,
        room_id: roomId
    }).then(function() { 
        res.sendStatus(200);    
    }).catch(function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

router.put('/', function(req, res, next) {
    var data = req.body.data;
    var roomId = req.body.room_id;
    knex.select().table('song').where('room_id', roomId)
    .then(function(songs) {
        if(songs.length == 0) {
            // TODO: don't duplicate
            knex('song').insert({
                data: data,
                room_id: roomId
            }).then(function() { 
                res.sendStatus(200);    
            }).catch(function(err) {
                console.log(err.stack);
                res.sendStatus(500);
            });
        } else {
            knex('song').where('room_id', roomId).update('data', data)
            .then( function() {
                res.sendStatus(200);
            }).catch( function(err) {
                console.log(err.stack);
                res.sendStatus(500);
            });
        }
    });
});

router.delete('/', function(req, res, next) { // unused
    var roomId = req.body.room_id;
    
    knex('song').where('room_id', roomId).del()
    .then(function() { 
        res.sendStatus(200)
    }).catch(function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

module.exports = router;

