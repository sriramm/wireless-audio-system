var express = require('express');
var router = express.Router();
var rabbitmq = require('../rabbitmq');

router.post('/', function (req, res, next) {
    var trackId = req.body.track_id;
	var previewUrl = req.body.preview_url;
    var event = req.body.event;
    var source = req.body.source;
    var room = req.body.room;
    rabbitmq.sendEvent(room, trackId, previewUrl, event, source);
    res.sendStatus(200);
});

module.exports = router;
