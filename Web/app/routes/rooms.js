var knex = require('knex')(require('../knexfile'));
var express = require('express');
var router = express.Router();
var env = require('../env');
var rabbitmq = require('../rabbitmq');
var db = require('../db');

function roomIsLocked(room) {
    return room.password != null;
}

router.get('/', function(req, res, next) {    
    knex.select('room.id', 'room.name', 'room.password', knex.raw('COUNT(speaker_room.speaker_id) as receivers'))
    .table('room').leftOuterJoin('speaker_room', 'room.id', 'speaker_room.room_id')
    .groupByRaw('room.id, room.name, room.password').then(function(rooms) {
        for (var i = 0; i < rooms.length; i++) {
            rooms[i].href = '/rooms/' + rooms[i].id;
			rooms[i].locked = roomIsLocked(rooms[i]);
			delete rooms[i].password;
        }

        res.render('rooms', {
            'rooms': rooms
        });
    });
});

router.get('/:id', function(req, res, next) {  
    var id = req.params.id;

	db.getRoom(id).then(function(rooms) { 
		if (rooms.length === 0) {
			res.sendStatus(404);
			return;
		}
		var room = rooms[0];
		if (roomIsLocked(room)) {
            res.render('enter_password', {
                'room_id': id
            });
        } else {
            res.render('index', {
                'title' : 'Next Generation Wireless Audio Streaming',
                'spotify_client_id' : env.getSpotifyClientId(),
                'spotify_redirect_uri': env.getUrl() + '/callback/spotify',
                'room_id': room.id,
                'room_name': room.name,
                'room_locked': roomIsLocked(room),
                'room_password': room.password
            });
        }
	}).catch(function(err) {
	  	console.log(err.stack);
        res.sendStatus(500); 
	}); 
});

router.get('/:id/receivers', function(req, res, next) {
    var id = req.params.id;
    
	db.getReceiversInRoom(id).then(function(receivers) { 
		res.send(receivers);
	}).catch(function(err) {
	  	console.log(err.stack);
        res.sendStatus(500); 
	});
});

router.post('/', function(req, res, next) {
    var name = req.body.name;
    var password = req.body.password;
    password = password ? password : null; // for some reason null shows up as ''

    knex('room').insert({
        name: name,
        password: password
    }).returning('id').then(function(id) {
        var href = '/rooms/' + id;
        res.json({ href: href });
    }).catch(function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

router.post('/:id/join', function(req, res, next) {  
    var id = req.params.id;
    var password = req.body.password;

	db.getRoom(id).then(function(rooms) { 
		if (rooms.length === 0) {
			res.sendStatus(404);
			return;
		}
		var room = rooms[0];
		if (roomIsLocked(room) && room.password != password) {
            res.render('enter_password', {
                'room_id': room.id,
                'error_message': 'Password Incorrect'
            });
        } else {
            res.render('index', {
                'title' : 'Next Generation Wireless Audio Streaming',
                'spotify_client_id' : env.getSpotifyClientId(),
                'spotify_redirect_uri': env.getUrl() + '/callback/spotify',
                'room_id': room.id,
                'room_name': room.name,
                'room_locked': roomIsLocked(room),
                'room_password': room.password
            });
        }
	}).catch(function(err) {
	  	console.log(err.stack);
        res.sendStatus(500); 
	});
});

router.patch('/:id', function(req, res, next) {
    var id = req.params.id;
    var password = req.body.password;
    password = password ? password : null; // for some reason null shows up as ''
    
    knex('room').where('id', id).update('password', password)
    .then( function() {
        res.sendStatus(200);
    }).catch( function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

router.delete('/:id', function(req, res, next) {  
    var id = req.params.id;

	db.getReceiversInRoom(id).then(function(receivers) {
		var ips = [];
		for (var i = 0; i < receivers.length; i++) {
			ips.push(receivers[i].address);
		}
		rabbitmq.stopSpeakers(ips);
	}).then(function() {
		return knex('speaker_room').where('room_id', id).del();
	}).then(function() {
		return knex('song').where('room_id', id).del();
	}).then(function() {
		return knex('room').where('id', id).del();
	}).then(function() {
		res.sendStatus(200);
	}).catch(function(err) {
		console.log(err.stack);
		res.sendStatus(500);
	});
});

module.exports = router;

