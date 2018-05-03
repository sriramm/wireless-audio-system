var PlayerWidget = function() {
	var $el = $('#main-player .search-item');

	return {
		songChange: function(source, item) {
            $('#main-player').removeClass('hidden');
            
            var songInfo = MusicClient.getSongInformation(item);
			WidgetFactory.populateSearchItem($el, songInfo.title, songInfo.artist, songInfo.duration, songInfo.artwork_url, songInfo.href, item.uuid);

			$el.find(".play-pause-button").unbind('click');
			$el.find(".play-pause-button").click(function(e) {
				Player.togglePlay(source, item);
			});
		},
		play: function() {
			$el.find(".play-pause-button").removeClass("paused").addClass("paused");
		},
		pause: function() {
			$el.find(".play-pause-button").removeClass("paused");
		}
	};
}();

var WidgetFactory = function() {
	return {
        populateSearchItem: function($el, title, artist, duration, artworkUrl, href, uuid) {
            $el.attr('id', uuid);
			$el.find('.song-title a').text(title);
			$el.find('.song-title a').attr('href', href);
			$el.find('.song-artist').text(artist);
			$el.find('.cover-art img').attr('src', artworkUrl);
			$el.find('.cover-art a').attr('href', href);
        },
		makeSearchItem: function(title, artist, duration, artworkUrl, href, source, item) {
			var $el = $('#results .placeholder .search-item').clone();
			
            WidgetFactory.populateSearchItem($el, title, artist, duration, artworkUrl, href, item.uuid);
				
			$el.find(".play-pause-button").click(function(e) {
				Player.togglePlay(source, item);
			});
			
			return $el;
		}
	};
}();

var SearchController = function() {
	var $results = $('#results .list-group');
    var $spinner = $('#results .fa-spinner');
    
	return {
		play: function(uuid) {
			$results.find('.search-item').each(function() {
				if ($(this).attr('id') === uuid) {
					$(this).find(".play-pause-button").removeClass("paused").addClass("paused");
					return;
				}
			});
		},
		pause: function(uuid) {
			$results.find('.search-item').each(function() {
				if ($(this).attr('id') === uuid) {
					$(this).find(".play-pause-button").removeClass("paused");
					return;
				}
			});
		},
        showSpinner: function() {
            $spinner.removeClass('hidden');
        },
        hideSpinner: function() {
            $spinner.addClass('hidden');
        },
        clearResults: function() {
            $results.empty();
			Player.clearPlaylists();
        },
		populateResults: function(searchObject) {
			SearchController.hideSpinner();
            for (var i = 0; i < searchObject.items.length; i++) {
				var item = searchObject.items[i];
				var songInfo = MusicClient.getSongInformation(item);
				var $el = WidgetFactory.makeSearchItem(songInfo.title, songInfo.artist, songInfo.duration, songInfo.artwork_url, songInfo.href, item.source, item);
				$results.append($el);			
			}
		}
	};
}();

var RoomController = function() {
    var locked;
    var password;
    var id;
    var name;
    var $lock = $('#lock');
    var $deleteRoom = $('#delete-room');

    var Backend = {
        deleteRoom: function() {
            return $.ajax({
                type: 'DELETE',
                url: '/rooms/' + RoomController.getRoomId(),				
                success: function(data, status, jqXHR) {
                    // kick everybody out of the room
                    SocketIOClient.deleteRoom();
                },
                error: function(jqXHR, status, err) {}
            });
        },     
        updatePassword: function(password_) {
            return $.ajax({
                type: 'PATCH',
                data: {
                    'password': password_
                },
                url: '/rooms/' + RoomController.getRoomId(),		
                success: function(data, status, jqXHR) {
                    if (password_ === null) {
                        SocketIOClient.unlockRoom();
                    } else {
                        SocketIOClient.lockRoom(password_);
                    }            
                },
                error: function(jqXHR, status, err) {}
            });
        }
    };
          
    function toggleLock() {
        if (locked) {
            var result  = confirm("Current password: " +  password + "\nAre you sure you want to unlock this room?");
            if (result) {
                Backend.updatePassword(null);
            }            
        } else {
            var password_  = prompt("Enter a password");
            if (password_) {
                Backend.updatePassword(password_);
            }
        }
    }
    
    return {
        init: function(id_, name_, locked_, password_) {
            id = id_;
            name = name_;
            
            $lock.click(function(e) {
                toggleLock();
            });

            $deleteRoom.click(function(e) {
                Backend.deleteRoom();
            });
            
            if (locked_) {
                RoomController.lock(password_);
            } else {
                RoomController.unlock();
            }
        },
        getRoomId: function() {
            return id;
        },
        lock: function(password_) {
            password = password_;
            locked = true;
            $lock.find('.fa-unlock').addClass('hidden');
            $lock.find('.fa-lock').removeClass('hidden');  
        },
        unlock: function() {
            password = null;
            locked = false;
            $lock.find('.fa-lock').addClass('hidden');
            $lock.find('.fa-unlock').removeClass('hidden'); 
        }
    };
}();

var $searchForm = $('#search-form');
var $musicSources = $('#music-sources li');

$musicSources.click(function(e) {
	$musicSources.removeClass("active");
	$(this).addClass("active");

	var musicSource = $(this).attr('id');
	if (musicSource === 'soundcloud') {
		MusicClient.setClient(SoundCloudClient);
	} else if (musicSource === 'spotify') {
		MusicClient.setClient(SpotifyClient);
	}
});

$searchForm.submit(function(e) {
	e.preventDefault();
	var query = $(this).find('#query').val();
    SearchController.clearResults();
    SearchController.showSpinner();
	MusicClient.search(query)
		.then(function(data, status, jqXHR) {
			SearchController.populateResults(data);			
		})
		.catch(function(err) {
            SearchController.hideSpinner();
			if (err.message === 'auth missing') {
				MusicClient.authenticate();
			}
		});
});
