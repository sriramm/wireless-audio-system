var SpotifyClient = function() {
	var accessToken = '';
	var accessTokenExpiry = Date.now(); // in seconds
	var clientId;
	var redirectUri;
	var searchObject = { 'items': [], 'total': 0 };

	function setSearchObject(items, total) {
		for (var i = 0; i < total; i++) {
			items[i].source = 'spotify';
			items[i].uuid = Util.generateUUID();
		}
		searchObject.items = items;
		searchObject.total = total;
	}
	
	function getLoginURL(scopes) {
		return 'https://accounts.spotify.com/authorize?client_id=' + clientId +
			   '&redirect_uri=' + encodeURIComponent(redirectUri) +
			   '&scope=' + encodeURIComponent(scopes.join(' ')) +
			   '&response_type=token';
	}

	function accessTokenIsExpired() {
		if (accessToken === '') return true;
		return accessTokenExpiry.getTime() < Date.now();
	}

	return {
        init: function(clientId_, redirectUri_) {
            clientId = clientId_;
            redirectUri = redirectUri_;
        },
        /* "inherited" */
		authenticate: function() { // implicit grant flow
			var url = getLoginURL([]);
			window.addEventListener("message", function(event) {
				var hash = JSON.parse(event.data);
				if (hash.type == 'access_token_spotify') {
					accessToken = hash.access_token;
					accessTokenExpiry = new Date(Date.now() + 1000 * hash.expires_in);
				}
			}, false);
			var width = 450,
				height = 730,
				left = (screen.width / 2) - (width / 2),
				top = (screen.height / 2) - (height / 2);
			var w = window.open(
				url,
				'Spotify',
				'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
			);
		},
		getSongInformation: function(item) {
			return {
				'duration': Util.millisToMinutesAndSeconds(item.duration_ms),
				'title': item.name,
				'artist': item.artists[0].name,
				'artwork_url': item.album.images[1].url,
				'href': item.external_urls.spotify
			};
		},
		getTrackId: function(item) {
			return item.uri;
		},
		getSearchObject: function() {
			return searchObject;
		},
		search: function(query) {
			return  $.ajax({
				url: 'https://api.spotify.com/v1/search',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				data: {
					'q': query,
					'type': 'track'
				},
				success: function(data, status, jqXHR) {
					setSearchObject(data.tracks.items, data.tracks.items.length);
				},
				error: function(jqXHR, status, err) {}
			});
		}
	};
}();

var SoundCloudClient = function() {
	var searchObject = { 'items': [], 'total': 0 };

	function setSearchObject(items, total) {
		for (var i = 0; i < total; i++) {
			items[i].source = 'soundcloud';
			items[i].uuid = Util.generateUUID();
		}
		searchObject.items = items;
		searchObject.total = total;
	}
	
	return {
        /* "inherited" */
		authenticate: function() {
			// do nothing
		},
		getSongInformation: function(item) {
			var artworkUrl = (item.artwork_url === null) ? item.user.avatar_url : item.artwork_url;
            return {
				'duration': Util.millisToMinutesAndSeconds(item.duration),
				'title': item.title,
				'artist': item.user.username,
				'artwork_url': artworkUrl,
				'href': item.permalink_url
			};
		},
		getTrackId: function(item) {
			return '/tracks/' + item.id;
		},
		getSearchObject: function() {
			return searchObject;
		},
		search: function(query) {
			return $.ajax({
				type: 'POST',
				data: {
					'page_size': 200, 
					'query': query
				},
				url: '/search/soundcloud',						
				success: function(data, status, jqXHR) {
					setSearchObject(data.data.items, data.data.total);
				},
				error: function(jqXHR, status, err) {}
			});
		}
	};
}();

var MusicClient = function() {
	var client = SoundCloudClient;

	return {
		authenticate: function() {
			client.authenticate();
		},
		getSongInformation: function(item) {
			if (item.source === 'soundcloud') {
				return SoundCloudClient.getSongInformation(item);
			} else if (item.source === 'spotify') {
				return SpotifyClient.getSongInformation(item);
			}
			return null;
		},
		getTrackId: function(item) {
			if (item.source === 'soundcloud') {
				return SoundCloudClient.getTrackId(item);
			} else if (item.source === 'spotify') {
				return SpotifyClient.getTrackId(item);
			}
			return null;
		},
		getSearchObject: function() {
			return client.getSearchObject();
		},
		search: function(query) {
			var promise = new Promise(function(resolve, reject) {
				client.search(query).then(function(data, status, jqXHR) {
					var searchObject = client.getSearchObject();
					resolve(searchObject);
				}, function(jqXHR, status, err) {
					reject(new Error('auth missing'));
				});
			});
			return promise;
		},
		setClient: function(c) {
			client = c;
		}
	};
}();
