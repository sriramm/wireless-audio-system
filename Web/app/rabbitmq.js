var db = require('./db');
var amqp = require('amqplib');
var env = require('./env');

var amqpUri;
var receivers;

module.exports = function() {
	return {
		init: function(ip) {
			var port = 5672;
			amqpUri = env.getRabbitConfig();
		},
		sendEvent: function(room, trackId, previewUrl, event, source) {
			db.getReceiversInRoom(room).then(function(receivers_data) {
				receivers = receivers_data;
				amqp.connect(amqpUri).then(function(conn, err) {
	            	if (err != null) {
	            		console.log(err);
	            		return;
	            	}

	            	conn.createChannel().then(function(ch) {
	            		for (var i=0;i<receivers.length;i++) {
							var receiver = receivers[i];
							var requestObj = JSON.stringify({ 'track_id': trackId, 'preview_url':previewUrl, 'event': event, 'source': source });
							var ex = 'event_stream';
							ch.assertExchange(ex, 'direct', {durable: false});
				    		ch.publish(ex, receiver.address, new Buffer(requestObj)); // routing key = receiver IP
			    			console.log(" [x] Sent %s: '%s'", receiver.address, requestObj);
						}
	            	});
					setTimeout(function() { conn.close(); }, 500);
				});
			});
		},
		restartSpeakers: function(room) {
			var trackId = '', source = '';
			db.getCurrentlyPlaying(room).then(function(data) {
				if (data.length > 0){
					var prevPlaybackState = JSON.parse(data[0].data)['playback']['state'];
					var source = JSON.parse(data[0].data)['properties']['source'];
					var trackId, previewUrl;
					if (source == 'soundcloud') {
						trackId = '/tracks/'+JSON.parse(data[0].data)['properties']['id']+'/';
					} else if (source == 'spotify') {
						trackId = JSON.parse(data[0].data)['properties']['uri'];
						previewUrl = JSON.parse(data[0].data)['properties']['preview_url'];
					}

					if (prevPlaybackState == 'playing') {
						module.exports.sendEvent(room, trackId, previewUrl, 'restart', source); // start off playing, since song was playing previously
					} else if (prevPlaybackState == 'paused') {
						module.exports.sendEvent(room, trackId, previewUrl, 'pause', source); // start off paused, since song was paused previously
					}
				}
			});
		},
		removeSpeaker: function(ip_remove) {
			console.log(ip_remove);
			var ip = ip_remove[0].address;
			amqp.connect(amqpUri).then(function(conn) {
				conn.createChannel().then(function(ch) {
					var ex = 'event_stream';
					ch.assertExchange(ex, 'direct', {durable: false});
					var requestObj = JSON.stringify({ 'event': 'stop' });
			    	ch.publish(ex, ip, new Buffer(requestObj)); // routing key = receiver IP
		    		console.log(" [x] Sent %s: '%s'", ip, requestObj);
		  		});
		  		setTimeout(function() { conn.close(); }, 500);
			}).catch(function(err) {
				console.log(err.stack);
			});
		},
		stopSpeakers: function(ip_list) {
			for (var i=0;i<ip_list.length;i++) {
				var receiver = ip_list[i];
				module.exports.removeSpeaker([{'address':receiver}]); // send as array, since remove speaker accepts array with address key
			}
		}
	};
}();
