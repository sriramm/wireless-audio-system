var knex = require('knex')(require('./knexfile'));

module.exports = function() {
	return {
		deleteConfigurations: function() {
			return knex('speaker_room').del();
		},
		deleteReceivers: function() {
			return knex('speaker').del();
		},
		getReceiversInRoom: function(roomId) {
			return knex('speaker')
				.leftOuterJoin('speaker_room as sr', 'speaker.id', 'sr.speaker_id')
				.where('sr.room_id', roomId)
				.select('*');
		},
		getIpOfReceiver: function(receiverId) {
			return knex('speaker')
				.where('id', receiverId)
				.select('address');
		},
		getCurrentlyPlaying: function(roomId) {
			return knex('song')
				.where('room_id', roomId)
				.select('*');
		},
		createConfiguration: function(roomId, receiverId) {
			return knex('speaker_room')
				.insert({
					speaker_id: receiverId,
					room_id: roomId
				});
		},
		deleteConfiguration: function(roomId, receiverId) {
			return knex('speaker_room')
				.where({
					speaker_id: receiverId,
					room_id: roomId
				})
				.del();
		},
		getRoom: function(roomId) {
			return knex('room')
				.where('id', roomId)
				.select('*');
		}
	};
}();
