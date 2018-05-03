var db = require('../db');
var express = require('express');
var router = express.Router();
var rabbitmq = require('../rabbitmq');

router.post('/', function(req, res, next) {
    var receiverId = req.body.receiver_id;
    var roomId = req.body.room_id;

    db.createConfiguration(roomId, receiverId).then(function() {
        rabbitmq.restartSpeakers(roomId);
        res.sendStatus(200);
    }).catch(function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });
});

router.delete('/', function(req, res, next) {
    var receiverId = req.body.receiver_id;
    var roomId = req.body.room_id;

    db.deleteConfiguration(roomId, receiverId).then(function() {
        res.sendStatus(200);
    }).catch(function(err) {
        console.log(err.stack);
        res.sendStatus(500);
    });

    db.getIpOfReceiver(receiverId).then(function(ip) {
        rabbitmq.removeSpeaker(ip);
    }).catch(function(err) {
        console.log(err.stack);
    });
});

module.exports = router;
