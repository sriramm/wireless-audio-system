var EventManager = function() {
	function sendEvent(item, event, trackId) {
		var previewUrl = (item.preview_url == null) ? null : item.preview_url;
		return $.ajax({
			type: 'POST',
			data: {
				'track_id': trackId, 
				'event': event,
				'source': item.source,
				'room': RoomController.getRoomId(),
				'preview_url': previewUrl
			},
			url: '/events',
			success: function(data, status, jqXHR) {},
			error: function(jqXHR, status, err) {}
		});
	}

	return {
		sendPlayEvent: function(item, trackId) {
			sendEvent(item, 'play', trackId);
		},
		sendPauseEvent: function(item, trackId) {
			sendEvent(item, 'pause', trackId);
		},
		sendSongChangeEvent: function(item, trackId) {
			sendEvent(item, 'play', trackId);
		}
	};
}();