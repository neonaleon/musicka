var express = require('express');

// create an express webserver
var app = express.createServer(express.logger(), express.static(__dirname + '/public'), express.bodyParser(), express.cookieParser(),
// set this to a secret value to encrypt session cookies
express.session({
	secret : process.env.SESSION_SECRET || 'secret123'
}), require('faceplate').middleware({
	app_id : process.env.FACEBOOK_APP_ID || '528686930488180',
	secret : process.env.FACEBOOK_SECRET || '756a7cfcdf1e8c38d3299fd7964a5121',
	scope : 'user_likes,user_photos,user_photo_video_tags'
}));

app.configure(function() {
	// disable layout
	app.set("view options", {
		layout : false
	});

	// make a custom html template
	app.register('.html', {
		compile : function(str, options) {
			return function(locals) {
				return str;
			};
		}
	});
});

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log("Listening on " + port);
});

function handle_request(req, res) {
	res.render('client.html');
}

app.get('/', handle_request);
app.post('/', handle_request);
