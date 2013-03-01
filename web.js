var express				= require('express');
var passport			= require('passport');
var FacebookStrategy	= require('passport-facebook').Strategy;

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '528686930488180';
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_SECRET || '756a7cfcdf1e8c38d3299fd7964a5121';
var APP_DOMAIN = process.env.APP_DOMAIN || 'localhost:3000/';
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
	console.log(req.query.video);
	console.log(req.query.fbid);
	res.send('OK');
}

function handle_remove_song_request(req, res) {
	console.log(req.query.video);
	console.log(req.query.fbid);
	res.send('OK');
}

function handle_get_list_request(req, res) {
	
}

function handle_rate_song_request(req, res) {
	if (req.facebook.token) {
		console.log(req.facebook);
		// use fql to get a list of my friends that are using this app
		req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(result) {
			//req.friends_using_app = result;
			console.log(result);
		});
	}
}

app.get('/', passport.authenticate('facebook'));
app.post('/', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
	failureRedirect : '/login'
	
}), function(req, res) {
	// Successful authentication, redirect home.
	res.redirect('/canvas');
});

app.get('/canvas', handle_request);
app.post('/canvas', handle_request);

app.get('/add', handle_add_song_request);
app.post('/add', handle_add_song_request);

app.get('/remove', handle_remove_song_request);
app.post('/remove', handle_remove_song_request);

app.get('/getlist', handle_get_list_request);
app.post('/getlist', handle_get_list_request);

app.get('/rate', handle_rate_song_request);
app.post('/rate', handle_rate_song_request);