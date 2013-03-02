var express				= require('express');
var passport			= require('passport');
var FacebookStrategy	= require('passport-facebook').Strategy;
var pg					= require('pg');

var FACEBOOK_APP_ID		= process.env.FACEBOOK_APP_ID || '537482629624950';
var FACEBOOK_APP_SECRET	= process.env.FACEBOOK_SECRET || '01f9950d67e919d5d79e34e195ea5080';
var APP_DOMAIN			= process.env.APP_DOMAIN || 'http://localhost:3000/';
var PG_CONNECT_STR		= process.env.DATABASE_URL || 'postgres://postgres:musicka@localhost:5432/musicka-local'; 
//'postgres://btqkctxdnitkrq:vZWExA6HeLbxst7MHzLGf9nBVA@ec2-54-243-242-213.compute-1.amazonaws.com/d35bo6oug912uf';

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
	clientID : FACEBOOK_APP_ID,
	clientSecret : FACEBOOK_APP_SECRET,
	callbackURL : APP_DOMAIN + 'auth/facebook/callback'
}, function(accessToken, refreshToken, profile, done) {
	// asynchronous verification, for effect...
	process.nextTick(function() {

		// To keep the example simple, the user's Facebook profile is returned to
		// represent the logged-in user.  In a typical application, you would want
		// to associate the Facebook account with a user record in your database,
		// and return that user instead.
		return done(null, profile);
	});
}));

// Initialise postgres connection
var client;
client = new pg.Client(PG_CONNECT_STR);
client.connect();

// create an express webserver
var app = express();

// Configure express webserver
app.configure(function() {
	// make a custom html renderer
	app.engine('.html', require('ejs').renderFile);
	app.engine('.htm', require('ejs').renderFile);
	
	app.use(express.logger());
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret : process.env.SESSION_SECRET || 'secret123'
	}));
	app.use(passport.initialize());
	app.use(passport.session()); 
});

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log("Listening on " + port);
});

function handle_request(req, res) {
	res.render('client.html');
}

function handle_add_song_request(req, res) {
	client.query("INSERT INTO user_playlist(id, song, rating) values('"+req.query.fbid+"', '"+req.query.video+"', 0)");
	res.send('OK');
}

function handle_remove_song_request(req, res) {
	client.query("DELETE FROM user_playlist WHERE id = '"+req.query.fbid+"' AND song = '"+req.query.video+"'");
	res.send('OK');
}

function handle_get_list_request(req, res) {
	var query = client.query("SELECT song, rating FROM user_playlist WHERE id = '"+req.body.fbid+"'");
	var playlist = [];
	query.on('row', function(row) {
		playlist.push({v: row.song, r: row.rating});
	});
	query.on('end', function(result) {
		var output = {};
		output['list'] = playlist;
		res.json(output);
	});
}

function handle_rate_song_request(req, res) {
	client.query("UPDATE user_playlist SET rating = '"+req.body.rate+"' WHERE id = '"+req.body.fbid+
		"' AND song = '"+req.body.video+"'");
	res.send('OK');
}

app.get('/auth/facebook', passport.authenticate('facebook'));
app.post('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
	failureRedirect : '/login'
	
}), function(req, res) {
	// Successful authentication, redirect to app
	res.redirect('/');
});
app.post('/auth/facebook/callback', passport.authenticate('facebook', {
	failureRedirect : '/login'
	
}), function(req, res) {
	// Successful authentication, redirect to app
	res.redirect('/');
});

app.get('/', handle_request);
app.post('/', handle_request);

app.get('/add', handle_add_song_request);
app.post('/add', handle_add_song_request);

app.get('/remove', handle_remove_song_request);
app.post('/remove', handle_remove_song_request);

app.get('/getlist', handle_get_list_request);
app.post('/getlist', handle_get_list_request);

app.get('/rate', handle_rate_song_request);
app.post('/rate', handle_rate_song_request);