var express = require('express');
var pg = require('pg');
var graph = require('fbgraph');
var decoder = require('./signedrequest.js');

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '537482629624950';
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_SECRET || '01f9950d67e919d5d79e34e195ea5080';

var APP_DOMAIN = process.env.APP_DOMAIN || '//localhost:3000/';
var PG_CONNECT_STR = process.env.DATABASE_URL || 'postgres://postgres:musicka@localhost:5432/musicka-local';
//'postgres://btqkctxdnitkrq:vZWExA6HeLbxst7MHzLGf9nBVA@ec2-54-243-242-213.compute-1.amazonaws.com/d35bo6oug912uf';
var PORT = process.env.PORT || 3000;

// Initialise signed request decoder
var verifier = new decoder(FACEBOOK_APP_SECRET);

// Initialise postgres connection
var client = new pg.Client(PG_CONNECT_STR);
client.connect();

//query = client.query("CREATE TABLE song_vectors (id varchar(11) PRIMARY KEY, vector integer ARRAY[30])");

// create an express webserver
var app = express();

// Configure express webserver
app.configure(function() {
	// make a custom html renderer
	app.engine('.html', require('ejs').renderFile);
	app.engine('.htm', require('ejs').renderFile);
	
	app.use(express.logger());
	//app.use(express.compress());
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret : process.env.SESSION_SECRET || 'secret123'
	}));
});

app.listen(PORT, function() {
	console.log("Listening on " + PORT);
});

function handle_request(req, res) {
	res.render('client.html');
}

// Good luck
/*
 function handle_recommend(req, res) {
 var query	= 'SELECT uid FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1=me()) AND is_app_user=1'
 var user	= req.body.fbid;
 var token	= null;

 var tokenQuery = client.query("SELECT token FROM user_token WHERE id = '" + user + "'");
 tokenQuery.on('row', function(row) {
 token = row.token;
 });
 tokenQuery.on('end', function(result) {
 if(token === null) {
 res.redirect('/auth/facebook');
 return;
 }

 graph.setAccessToken(token);
 graph.fql(query, function(err, fres) {
 var friendList = fres.data;
 if(typeof friendList === 'undefined') {
 res.json({list: []});
 return;
 }
 var friends = [];
 for(var i = 0; i < friendList.length; i++) {
 friends.push(friendList[i].uid);
 }
 for(var i = 0; i < friends.length; i++) {
 var f = friends[i];
 var songs = [];
 var processed = 0;
 getPlaylist(f, function(result) {
 for(var j = 0; j < result.length; j++) {
 songs.push(result[j].v);
 }
 processed++;
 if(processed >= friends.length) {
 var arr = [];
 if(songs.length > 0) {
 arr.push(songs[Math.floor(Math.random() * songs.length)])
 }
 var output = {list: arr};
 res.json(output);
 }
 });
 }
 });
 });
 }
 */

function handle_add_song_request(req, res) {
	var fb = verifier.decode(req.query.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}
	client.query("INSERT INTO user_playlist(id, song, rating) values('" + fb.user_id + "', '" + req.query.video + "', 0)");
	res.send('OK');
}

function handle_remove_song_request(req, res) {
	var fb = verifier.decode(req.query.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}
	client.query("DELETE FROM user_playlist WHERE id = '" + fb.user_id + "' AND song = '" + req.query.video + "'");
	res.send('OK');
}

function handle_get_list_request(req, res) {
	var fb = verifier.decode(req.body.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}

	getPlaylist(fb.user_id, function(result) {
		var output = {};
		output['list'] = result;
		res.json(output);
	});
}

function getPlaylist(userID, done) {
	var query = client.query("SELECT song, rating FROM user_playlist WHERE id = '" + userID + "'");
	var playlist = [];
	query.on('row', function(row) {
		playlist.push({
			v : row.song,
			r : row.rating
		});
	});
	query.on('end', function(result) {
		done(playlist);
	});
}

function handle_rate_song_request(req, res) {
	var fb = verifier.decode(req.body.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}
	client.query("UPDATE user_playlist SET rating = '" + req.body.rate + "' WHERE id = '" + fb.user_id + "' AND song = '" + req.body.video + "'");
	res.send('OK');
}

function handle_define_js(req, res) {
	res.set('Content-Type', 'text/javascript');
	res.render('define.ejs', {
		id : FACEBOOK_APP_ID,
		domain : APP_DOMAIN
	});
}

/*function handle_user_token(req, res) {
 var userID	= req.body.fbid;
 var token	= req.body.token;

 // Extend token
 graph.get(	"oauth/access_token?grant_type=fb_exchange_token&client_id="
 + FACEBOOK_APP_ID + "&client_secret=" + FACEBOOK_APP_SECRET +
 "&fb_exchange_token=" + token,
 function(err, fres) {
 var done = function() {
 res.send('OK');
 }
 addToken(userID, fres.access_token, done);
 });
 }*/

/*function addToken(fbid, token, done) {
 var query = client.query("SELECT token FROM user_token WHERE id = '" + fbid + "'");
 query.on('end', function(result) {
 var query2;
 if(result.rowCount >= 1) {
 query2 = client.query("UPDATE user_token SET token = '"+token+"' WHERE id = '"+fbid+"'");
 } else {
 query2 = client.query("INSERT INTO user_token(id, token) values('"+fbid+"', '"+token+"')");
 }
 query2.on('end', function(result) {
 done();
 });
 });
 }*/

/* Recommendations */
function handle_recommend_store(req, res) {
	/* stores a user's playlist vector */
	var fb = verifier.decode(req.body.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}

	var userID = fb.user_id;
	var array = req.body.array;
	for (var i in array) {
		array[i] = parseInt(array[i]);
	}
	var query = client.query("SELECT vector FROM playlist_vectors WHERE id = '" + userID + "'");
	query.on('end', function(result) {
		var query2;
		if (result.rowCount >= 1) {
			query2 = client.query("UPDATE playlist_vectors SET vector = ARRAY[" + array + "] WHERE id = '" + userID + "'");
		} else {
			query2 = client.query("INSERT INTO playlist_vectors(id, vector) values('" + userID + "', ARRAY[" + array + "])");
		}
		res.send('OK');
	});
}

function handle_recommend_retrieve(req, res) {
	/* retrieves user playlist vector */
	var fb = verifier.decode(req.body.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}

	var userID = fb.user_id;
	var query = client.query("SELECT vector FROM playlist_vectors WHERE id = '" + userID + "'");
	var array = undefined;
	query.on('row', function(row) {
		array = row.vector;
	});
	query.on('end', function(result) {
		res.json(array);
	});
}

function handle_recommend_retrieve_friends(req, res) {
	var fb = verifier.decode(req.body.sr);
	if (fb === null) {
		res.send('Bad request');
		return;
	}

	var query = 'SELECT uid FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1=me()) AND is_app_user=1'
	var user = fb.user_id;
	var token = req.body.token;
	
	graph.setAccessToken(token);
	graph.fql(query, function(err, fres) {
		var friendList = fres.data;
		if ( typeof friendList === 'undefined') {
			res.json({});
			// handle another way...
			return;
		}
		if(friendList.length <= 0) {
			res.json({});
			return;
		}
		
		var response_object = {};

		var queryVector = "SELECT id, vector FROM playlist_vectors WHERE id IN ('" + friendList[0].uid + "'";
		for(var i = 1; i < friendList.length; i++) {
			queryVector += ",'" + friendList[i].uid + "'";
		}
		queryVector += ")";
		var query_friend_vector = client.query(queryVector);
		query_friend_vector.on('row', function(row) {
			response_object[row.id] = row.vector;
		});
		query_friend_vector.on('end', function(result) {
			res.json(response_object);
			
		});
	});
}

function handle_recommend_getlist_friend(req, res) {
	/* retrieves list of songs from a friend's playlist */
	var query = client.query("SELECT song FROM user_playlist WHERE id = '" + req.body.id + "'");
	
	var response_obj = { vectors: {}, };
	var playlist = [];
	query.on('row', function(row) {
		playlist.push( row.song );
		//console.log(row.song, "SELECT id, vector FROM song_vectors WHERE id = '" + row.song + "'");
	});
	query.on('end', function(result) {
		response_obj.playlist = playlist;
		var q = "SELECT id, vector FROM song_vectors WHERE id IN ('" + playlist[0] + "'";
		for(var i = 1; i < playlist.length; i++) {
			q += ",'" + playlist[i] + "'";
		}
		q += ")";
		var query2 = client.query(q);
		query2.on('row', function(row) {
			response_obj.vectors[row.id] = row.vector;
		});
		query2.on('end', function(result) {
			console.log(response_obj);
			res.json(response_obj);
		});
	});
}

function handle_store_song_vector(req, res) {
	var songID = req.body.id;
	var array = req.body.array;
	for (var i in array) {
		array[i] = parseInt(array[i]);
	}
	var query = client.query("SELECT vector FROM song_vectors WHERE id = '" + songID + "'");
	query.on('end', function(result) {
		var query2;
		if (result.rowCount > 0) {
			query2 = client.query("UPDATE song_vectors SET vector = ARRAY[" + array + "] WHERE id = '" + songID + "'");
		} else {
			query2 = client.query("INSERT INTO song_vectors(id, vector) values('" + songID + "', ARRAY[" + array + "])");
		}
		res.send('OK');
	});
}

app.get('/', handle_request);
app.post('/', handle_request);

app.get('/scripts/define.js', handle_define_js);
app.post('/scripts/define.js', handle_define_js);

app.get('/add', handle_add_song_request);
app.post('/add', handle_add_song_request);

app.get('/remove', handle_remove_song_request);
app.post('/remove', handle_remove_song_request);

app.get('/getlist', handle_get_list_request);
app.post('/getlist', handle_get_list_request);

app.get('/rate', handle_rate_song_request);
app.post('/rate', handle_rate_song_request);

app.get('/recommend/store', handle_recommend_store);
app.post('/recommend/store', handle_recommend_store);

app.get('/recommend/retrieve', handle_recommend_retrieve);
app.post('/recommend/retrieve', handle_recommend_retrieve);

app.get('/recommend/retrieve_friends', handle_recommend_retrieve_friends);
app.post('/recommend/retrieve_friends', handle_recommend_retrieve_friends);

app.post('/recommend/get_friend_playlist', handle_recommend_getlist_friend);

app.post('/recommend/store_song_vector', handle_store_song_vector);
