var SoundCloud = { 'client_id': 'ba673207a38a5bc7443a2e069c59c7df', 'client_secret': null };
var Spotify = { 'client_id': '4dc2fe64792b4539a454e3d71e84399f', 'client_secret': '5153f6d2d102432b880bf0ae11c6fec4' };
var rabbitMQ = { 'user': 'admin', 'pass': 'password', 'port': 5672 };
var localIp;
var port;

exports.getSoundCloudClientId = function() {
	return SoundCloud.client_id;
};

exports.getSpotifyClientId = function() {
	return Spotify.client_id;
};

exports.getSpotifyClientSecret = function() {
	return Spotify.client_secret;
};

exports.setLocalIp = function(ip) {
	localIp = ip;
};

exports.getLocalIp = function() {
	return localIp;
};

exports.getPort = function() {
	return port;
};

exports.setPort = function(port_) {
	port = port_; 
};

exports.getUrl = function() {
	return 'http://' + 'localhost' + ':' + port;
};

exports.getRabbitConfig = function() {
	return 'amqp://'+rabbitMQ.user+':'+rabbitMQ.pass+'@localhost:' + rabbitMQ.port;
}