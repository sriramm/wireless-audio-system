var express = require('express');
var router = express.Router();
var env = require('../env');

router.get('/spotify', function(req, res, next) {
  res.render('spotify_callback', { 
      'accepted_origin' : env.getUrl()
  });
});

module.exports = router;
