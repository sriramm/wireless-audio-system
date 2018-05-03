var express = require('express');
var router = express.Router();
var SC = require('node-soundcloud');

function sortByKey(array, key) {
    return array.sort(function(a, b) {
    	var x = a[key]; var y = b[key];
    	x = x.toLowerCase();
    	y = y.toLowerCase();				
   	 	if (x == y) return 0;   				
		return x < y ? -1 : 1;
	});
}

function createSearchObject(tracks) {
	var searchObj = {'items': [], 'total': tracks.length};
	for (var i = 0; i < tracks.length; i++) {
		var track = tracks[i];

	    var user = {
			'id': track.user.id, 
			'username': track.user.username,
			'avatar_url': track.user.avatar_url,
			'permalink': track.user.permalink, 
			'permalink_url': track.user.permalink_url,
			'uri': track.user.uri
	    };

 	    var obj = {
			'title': track.title,
			'duration': track.duration, 
			'id': track.id, 
			'artwork_url': track.artwork_url, 
			'permalink': track.permalink, 
			'permalink_url': track.permalink_url,
			'streamable': track.streamable,
			'stream_url': track.stream_url,
			'uri': track.uri,
			'user': user
 	    };

	    searchObj.items.push(obj);	   
	}
	sortByKey(searchObj.items, 'title');
	return searchObj;
}

router.post('/soundcloud', function (req, res, next) {
	var limit = req.body.page_size;
	var query = req.body.query;
    SC.get('/tracks', { limit: limit, q: query }, function(err, tracks) {
        if (err) {
        	console.log(err);
        	res.sendStatus(500);
        } else {
			var searchObj = createSearchObject(tracks);
			res.json({ data: searchObj });
        }
    });
});

module.exports = router;
