module.exports = function(server) {
	var io = require('socket.io')(server);
	io.on('connection', function(socket){
		console.log('a user connected (backend)');

        /* join room */
		socket.on('join room', function(room) {
			socket.join(room);
            socket.room = room;
		});
        
        /* delete room */
        socket.on('delete room', function() {
            var href = "http://localhost:3000/rooms";
            io.to(socket.room).emit('delete room', href);
		});
        
        /* lock room */
        socket.on('lock room', function(password) {
            io.to(socket.room).emit('lock room', password);
		});
        
        /* unlock room */
        socket.on('unlock room', function() {
            io.to(socket.room).emit('unlock room');
		});
        
        /* add receiver */
        socket.on('add receiver', function(id, ip) {
            io.to(socket.room).emit('add receiver', id, ip);
		});
        
        /* remove receiver */
        socket.on('remove receiver', function(id) {
            io.to(socket.room).emit('remove receiver', id);
		});
        
		/* song change */
		socket.on('song change', function(source, item) {
			console.log('song change (backend)');
			io.to(socket.room).emit('song change', source, item);
		});

		/* play song */
		socket.on('play song', function() {
			console.log('play song (backend)');
			io.to(socket.room).emit('play song');
		});

		/* pause song */
		socket.on('pause song', function() {
			console.log('pause song (backend)');
			io.to(socket.room).emit('pause song');
		});

		/* disconnect */
		socket.on('disconnect', function() {
            socket.leave(socket.room);
			console.log('user disconnected (backend)');
		});
	});
};
