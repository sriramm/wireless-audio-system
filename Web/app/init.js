var http = require('http');
var db = require('./db');
var quickLocalIp = require('quick-local-ip');
var env = require('./env');
var rabbitmq = require('./rabbitmq');
var SC = require('node-soundcloud');

module.exports = function(port, server) {
	function initSoundCloudClient() {
		SC.init({
  			id: env.getSoundCloudClientId()
		});
	}

	function initSocketIO(server) {
		require('./socket.io')(server);
	}

	function initRabbitMQ(ip) {
		rabbitmq.init(ip);		
	}

	// notify receivers of server IP  	
  	function registerWithReceivers(callback) {
  		var queueUri = 'http://sound-system-se464.herokuapp.com';
  		var ip = env.getLocalIp();
  		console.log('registering with ' + queueUri + ' using ip ' + ip + '...');
  		http.request(queueUri + '/server/post/' + ip, function(res) {
	    	console.log('success!');
	    	callback();
	  	}).on('error', function(err) {
	    	console.log('error!');
	    	callback();
	  	}).end();
  	}

  	function deregisterWithReceivers(callback) {
		var queueUri = 'http://sound-system-se464.herokuapp.com';
		console.log('deregistering with ' + queueUri + '...');
	    http.request(queueUri + '/server/clear', function(res) {
			console.log('success!');
			callback();
	    }).on('error', function(err) {
			console.log('error!');
			callback();		
	    }).end();
	}

	process.on('SIGTERM', function() {
		console.log("Gracefully shutting down from SIGTERM");
		deregisterWithReceivers(function() {
			process.exit(0);
		});		
	});

	process.on('SIGINT', function() {
		console.log("Gracefully shutting down from SIGINT");
		deregisterWithReceivers(function() {
			process.exit(0);
		});
	});

	env.setLocalIp(quickLocalIp.getLocalIP4());
	env.setPort(port);
	console.log('deleting data in table `speaker_room`...');
	db.deleteConfigurations().then(function() { 
		console.log('success!');
		console.log('deleting data in table `speaker`...');
		db.deleteReceivers().then(function() {
			console.log('success!');
			registerWithReceivers(function() {
				initSocketIO(server);
				console.log('SocketIO initialized');
				initRabbitMQ(env.getLocalIp());
				console.log('RabbitMQ initialized');
				initSoundCloudClient();
				console.log('SoundCloud client initialized');
			});
		}).catch(function(err) {
		  	console.log('error!');   
		});
	}).catch(function(err) {
	  	console.log('error!');   
	});
};
