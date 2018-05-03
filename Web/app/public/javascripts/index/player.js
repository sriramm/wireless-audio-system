var Player = function() {
    var STATE = {
        PLAYING: 'playing',
        PAUSED: 'paused',
        STOPPED: 'stopped'  
    };
      
	var currentlyPlaying = { 'uuid': null, 'properties': null, 'reference': { 'source': null, 'index': -1 }, 'playback': { 'time': 0, 'state': STATE.STOPPED } };
	var playlist = { 'soundcloud': [], 'spotify': [] };

    var Backend = {
        updateCurrentlyPlaying: function() {
            return $.ajax({
                type: 'PUT',
                data: {
                    'data': JSON.stringify(currentlyPlaying),
                    'room_id': RoomController.getRoomId()
                },
                url: '/songs',				
                success: function(data, status, jqXHR) {
                },
                error: function(jqXHR, status, err) {}
            });
        },
        getCurrentlyPlaying: function() {
            return $.ajax({
                type: 'GET',
                data: {
                    'room_id': RoomController.getRoomId()
                },
                url: '/songs',				
                success: function(data, status, jqXHR) {
                    if (data) {
                        var currentlyPlaying_ = JSON.parse(data.data);
                        currentlyPlaying = currentlyPlaying_;
                        PlayerWidget.songChange(currentlyPlaying.reference.source, currentlyPlaying.properties);
                        if (currentlyPlaying.playback.state === STATE.PLAYING) {
                            PlayerWidget.play();
                        }
                    }                
                },
                error: function(jqXHR, status, err) {}
            });
        }
    };
    
	function addToPlaylist(source, item) {
		var obj = { 'uuid': item.uuid, 'properties': item, 'playback': { 'time': 0, 'state': 'stopped' } };
		playlist[source].push(obj);
		return playlist[source].length - 1;
	}
	
	function saveCurrentlyPlaying() {
		var source = currentlyPlaying.reference.source;
		var index = currentlyPlaying.reference.index;
		playlist[source][index].playback = currentlyPlaying.playback;
	}

	function clearSoundCloudPlaylist() {
		playlist['soundcloud'] = [];
		if (currentlyPlaying.reference.source === 'soundcloud') {
			currentlyPlaying.reference.index = -1;
		}
	}

	function clearSpotifyPlaylist() {
		playlist['spotify'] = [];
		if (currentlyPlaying.reference.source === 'spotify') {
			currentlyPlaying.reference.index = -1;
		}
	}
	
	return {
        Backend: Backend,
		setCurrentlyPlaying: function(source, item) {
			if (currentlyPlaying.reference.index !== -1) {
				currentlyPlaying.playback.state = STATE.PAUSED;
				saveCurrentlyPlaying();
				SearchController.pause(currentlyPlaying.uuid);
			}

			var indexInPlaylist = -1;
			for (var i = 0; i < playlist[source].length; i++) {
				var obj = playlist[source][i];
				if (obj.uuid === item.uuid) {
					indexInPlaylist = i;
				}
			}
			if (indexInPlaylist === -1) {
				indexInPlaylist = addToPlaylist(source, item);
			}

			currentlyPlaying.uuid = item.uuid;
			currentlyPlaying.properties = item;
			currentlyPlaying.reference.source = source;
			currentlyPlaying.reference.index = indexInPlaylist;
			currentlyPlaying.playback = playlist[source][indexInPlaylist].playback;

			PlayerWidget.songChange(source, item);
			Player.play();
		},
		clearPlaylists: function() {
			clearSoundCloudPlaylist();
			clearSpotifyPlaylist();
		},
		pause: function() {
			currentlyPlaying.playback.state = STATE.PAUSED;
			PlayerWidget.pause();
			SearchController.pause(currentlyPlaying.uuid);
            Backend.updateCurrentlyPlaying(); // update backend
		},
		play: function() {
			currentlyPlaying.playback.state = STATE.PLAYING;
			PlayerWidget.play();
			SearchController.play(currentlyPlaying.uuid);
            Backend.updateCurrentlyPlaying(); // update backend
		},
		togglePlay: function(source, item) {
			if (currentlyPlaying.uuid === item.uuid) {
				if (currentlyPlaying.playback.state === STATE.STOPPED || currentlyPlaying.playback.state === STATE.PAUSED) {			
					SocketIOClient.playSong();					
					EventManager.sendPlayEvent(item, MusicClient.getTrackId(item));
				} else if (currentlyPlaying.playback.state === STATE.PLAYING) {				
					SocketIOClient.pauseSong();				
					EventManager.sendPauseEvent(item, MusicClient.getTrackId(item));
				}
			} else {
				SocketIOClient.songChange(source, item);
				EventManager.sendSongChangeEvent(item, MusicClient.getTrackId(item));
			}
		}
	};
}();
