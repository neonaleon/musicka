var async = require('async');
var express = require('express');
var util = require('util');

// TODO database connection
var pg = require('pg').native;
var connectionString = process.env.DATABASE_URL || 'postgres://btqkctxdnitkrq:vZWExA6HeLbxst7MHzLGf9nBVA@ec2-54-243-242-213.compute-1.amazonaws.com/d35bo6oug912uf';
var client, query;
client = new pg.Client(connectionString);
client.connect();

//query = client.query('CREATE TABLE junk (name varchar(10), idk varchar(10))');
//query = client.query("INSERT INTO junk(name, idk) values('Ted', 'lolol')");
//query = client.query('SELECT * FROM junk');

/*query.on('row', function(row) {
	console.log("name: " + row.name);
	console.log("idk: " + row.idk);
});
query.on('end', function() {
	client.end();
});*/
//console.log(client);

// create an express webserver
var app = express.createServer(express.logger(), express.static(__dirname + '/public'), express.bodyParser(), express.cookieParser(),
// set this to a secret value to encrypt session cookies
express.session({
	secret : process.env.SESSION_SECRET || 'secret123'
}), require('faceplate').middleware({
	app_id : process.env.FACEBOOK_APP_ID,
	secret : process.env.FACEBOOK_SECRET,
	scope : 'user_likes,user_photos,user_photo_video_tags'
}));

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log("Listening on " + port);
});

app.dynamicHelpers({
	'host' : function(req, res) {
		return req.headers['host'];
	},
	'scheme' : function(req, res) {
		req.headers['x-forwarded-proto'] || 'http'
	},
	'url' : function(req, res) {
		return function(path) {
			return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(path);
		}
	},
	'url_no_scheme' : function(req, res) {
		return function(path) {
			return '://' + app.dynamicViewHelpers.host(req, res) + path;
		}
	},
});

function render_page(req, res) {
	req.facebook.app(function(app) {
		req.facebook.me(function(user) {
			res.render('index.ejs', {
				layout : false,
				req : req,
				app : app,
				user : user
			});
		});
	});
}

function handle_facebook_request(req, res) {

	// if the user is logged in
	if (req.facebook.token) {

		async.parallel([
		function(cb) {
			// query 4 friends and send them to the socket for this socket id
			req.facebook.get('/me/friends', {
				limit : 4
			}, function(friends) {
				req.friends = friends;
				cb();
			});
		},
		function(cb) {
			// query 16 photos and send them to the socket for this socket id
			req.facebook.get('/me/photos', {
				limit : 16
			}, function(photos) {
				req.photos = photos;
				cb();
			});
		},
		function(cb) {
			// query 4 likes and send them to the socket for this socket id
			req.facebook.get('/me/likes', {
				limit : 4
			}, function(likes) {
				req.likes = likes;
				cb();
			});
		},
		function(cb) {
			// use fql to get a list of my friends that are using this app
			req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(result) {
				req.friends_using_app = result;
				cb();
			});
		}], function() {
			render_page(req, res);
		});

	} else {
		render_page(req, res);
	}
}

app.get('/', handle_facebook_request);
app.post('/', handle_facebook_request);

app.get('/insert', function(req, res) {
	client.query("INSERT INTO junk(name, idk) values('Ted', 'lolol')");
	res.send('done insert');
});

app.get('/select', function(req, res) {
	console.log('select sent');
	var query = client.query("SELECT * FROM junk");
	query.on('row', function(row) {
		console.log('select completed');
		res.send(row);
	});
});