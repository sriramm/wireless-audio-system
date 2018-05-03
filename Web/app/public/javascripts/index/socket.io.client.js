var SocketIOClient = function() {
	var socket;
	
	return {
		init: function() {
			socket = io();
			socket.on('connect', function() {
				console.log('a user connected (frontend)');
                socket.emit('join room', RoomController.getRoomId());
			});
			socket.on('song change', function(source, item) {   
				console.log('song change (frontend)');
				Player.setCurrentlyPlaying(source, item);
			});
			socket.on('play song', function() {   
				console.log('play song (frontend)');
				Player.play();
			});
			socket.on('pause song', function() {   
				console.log('pause song (frontend)');
				Player.pause();
			});
            socket.on('delete room', function(href) {
				window.location.replace(href);
			});
            socket.on('lock room', function(password) {
                RoomController.lock(password);
			});
            socket.on('unlock room', function() {
                RoomController.unlock();
			});
            socket.on('add receiver', function(id, ip) {
               ReceiverController.addReceiver(id, ip);
			});
            socket.on('remove receiver', function(id) {
                ReceiverController.removeReceiver(id);
			});
		},
		songChange: function(source, item) {
			socket.emit('song change', source, item);
		},
		playSong: function() {
			socket.emit('play song');
		},
		pauseSong: function() {
			socket.emit('pause song');
		},
        deleteRoom: function() {
            socket.emit('delete room');
        },
        lockRoom: function(password) {
            socket.emit('lock room', password);
        },
        unlockRoom: function() {
            socket.emit('unlock room');
        },
        addReceiver: function(id, ip) {
            socket.emit('add receiver', id, ip);
        },
        removeReceiver: function(id) {
            socket.emit('remove receiver', id);
        }
	};
}();
