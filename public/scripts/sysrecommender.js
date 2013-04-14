/**
 * @author neonaleon
 */

var sysrecommender = {
	control: undefined,
	model: undefined,
	playlist_vector: undefined,
	norm_playlist_vector: undefined,
	song_vectors: {},
	
	acoustic_attributes: ['danceability', 'energy', 'speechiness'],
	num_acoustic_attributes: 3,
	num_equivalence_classes: 10,
	weight_vector: [0.35, 0.55, 0.1],
	
	friend_similarity: [], // [(cosine similarity, userID)]
	friend_playlists: {}, // { userID : [ songIDs ] }
	friend_song_vectors: {}, // { friendID : { songID : songVector } } }
	
	recommend_interval: 120000, // update recommendations every 2 mins

	topN_friends: 5,
	topN_songs: 2,
	
	toRetrieve: 0,
	retrieved: 0,
	
	focused: true,
	
	recommendations: [],
	eval_recommendations: {},
}

sysrecommender.init = function (control, model) {
	this.control = control;
	this.model = model;
	this.build_playlist_vector();
	
	$(window).bind('focus', function() { console.log('focused', sysrecommender.focused); sysrecommender.focused = true; }); 
	$(window).bind('blur', function() { console.log('focused', sysrecommender.focused); sysrecommender.focused = false; });
}

sysrecommender.build_playlist_vector = function () {
	/* called on init, use echonest api to async search for song data and construct user's playlist vector */
	this.playlist_vector = Vector.Zero(this.num_acoustic_attributes * this.num_equivalence_classes);
	for (var i in this.model.playList) {
		var song_obj = this.model.playList[i];
		nest.search_song({ combined: song_obj.title, results: 1 }, sysrecommender.on_add_song.bind(sysrecommender), { song: song_obj });
	}
}

sysrecommender.add_song = function (song_id) {
	/* called when songs added to playlist, performs the same async echonest search, async */
	if (this.model == undefined) return; // workaround initial addSong in musicplayer.js
	var song_obj = this.model._song(song_id);
	nest.search_song({ combined: song_obj.title, results: 1 }, sysrecommender.on_add_song.bind(sysrecommender), { song: song_obj });
}

sysrecommender.on_add_song = function (response, userData) {
	/* handler for when async echonest search returns */
	var song_vector = this.extract_song_data(response);
	this.song_vectors[userData.song.videoID] = song_vector;
	this.save_song_vector(userData.song.videoID, song_vector);
	
	this.playlist_vector = this.playlist_vector.add(song_vector);
	this.save_playlist_vector();
}

sysrecommender.extract_song_data = function (song_info) {
	/* extracts the song data from echonest search response into a song vector */ 
	console.log("Song Data: ", song_info);
	var song_vector = Vector.Zero(this.num_acoustic_attributes * this.num_equivalence_classes);
	for (var i in this.acoustic_attributes) {
		var attribute_value = song_info.audio_summary[ this.acoustic_attributes[i] ] * 10;
		if (attribute_value == null) continue; 
		var index = i * this.num_equivalence_classes + Math.floor(attribute_value);
		song_vector.elements[index] += 1;
	}
	return song_vector;
}

sysrecommender.remove_song = function (song_id) {
	this.playlist_vector = this.playlist_vector.subtract( this.song_vectors[song_id] );
	delete this.song_vectors[song_id];
	this.save_playlist_vector();
}

sysrecommender.cosine_similarity = function (a) {
	var v = $V(a).toUnitVector();
	return this.norm_playlist_vector.dot(v);
}

sysrecommender.process_playlists = function (res_json) {
	/* computes similarity of playlist vectors of all user's friends, and sorts them in descending order */
	this.friend_similarity = [];
	for (var k in res_json) {
		this.friend_similarity.push( [ this.cosine_similarity( res_json[k] ), k ] );
	}
	this.friend_similarity.sort( function(a, b){ return b[0] - a[0]; } );
	console.log("processed playlists: ", this.friend_similarity);
}

sysrecommender.start_recommendation = function () {
	/* send out requests for all friends' playlist */
	this.retrieved = 0;
	this.toRetrieve = this.friend_similarity.length;
	for (var i in this.friend_similarity) {
		if (i >= this.topN_friends) break;
		var friend_id = this.friend_similarity[i][1];
		this.get_friend_playlist( friend_id );
	}
}

sysrecommender.do_recommendation = function () {
	/* algorithm for recommendation here */
	for (var i in this.friend_similarity) {
		if (i >= this.topN_friends) break;
		var friend_id = this.friend_similarity[i][1];
		var similar = this.similar_songs(this.friend_song_vectors[friend_id]);
		var rated_similar = this.sort_rating(similar);
		console.log("recom results for: ", friend_id, this.friend_similarity[i][0]);
		for (var x in rated_similar) {
			console.log("song score: ", rated_similar[x][0], rated_similar[x][1]);
		}
		for (var j = 0; j < this.topN_songs; j++) {
			this.recommendations[ i * this.topN_songs + j ] = rated_similar[j][1];
			if (Math.random() < j/10) { // some random chance to replace with a random song from playlist
				var random = this.random_song(friend_id);
				this.recommendations[ i * this.topN_songs + j ] = random;
			}
		}
	}
	this.end_recommendation();
}

sysrecommender.sort_rating = function (in_list) {
	var list = [];
	for (var i in in_list) {
		var id = in_list[i][1];
		if (this.eval_recommendations[id] == undefined) this.eval_recommendations[id] = 0;
		var e = this.eval_recommendations[id]; 
		list.push( [ e, id ] );
	}
	list.sort( function(a, b){ return b[0] - a[0]; } );
	return list;
}

sysrecommender.random_song = function (friend_id) {
	return this.friend_playlists[friend_id][Math.floor(Math.random() * this.friend_playlists[friend_id].length)];
}

sysrecommender.similar_songs = function (song_vectors) {
	console.log("song_vectors: ", song_vectors);
	var similar = [];
	for (var k in song_vectors) {
		//similar.push( [ this.cosine_similarity( song_vectors[k] ), k ] );
		similar.push( this.score_song(this.norm_playlist_vector, song_vectors[k]), k);
	}
	similar.sort( function(a, b){ return b[0] - a[0]; } );
	return similar;
}

sysrecommender.score_song = function (vec, song_vec) {
	var score = 0.0;
	for (var i in vec.elements) {
		score += song_vec.elements[i] * this.weight_vector[ i/10 ];
	}
	return score;
}

sysrecommender.end_recommendation = function () {
	/* end the recommendation by showing the UI */
	// jquery the document
	// draw the ui
	var rreclist = $('#'+MUSICKA.Element.SYSRECOM_LIST_ID);
	rreclist.children().remove();
	for (var j in this.recommendations) {
		this.make_recommendation_item(MUSICKA.Element.SYSRECOM_LIST_ID, this.recommendations[j]);
	}
	console.log("end recommendations: ", this.recommendations);
}

sysrecommender.update_recommendation = function () {
	this.norm_playlist_vector = this.playlist_vector.toUnitVector();
	this.retrieve_friends();
}

sysrecommender.recommend = function () {
	/* periodic recommend loop */
	if (sysrecommender.focused) this.update_recommendation();
	setTimeout(function() { sysrecommender.recommend(); }, sysrecommender.recommend_interval);
}

/* UI */
sysrecommender.make_recommendation_item = function(div, videoID) {
	var column = $('#'+div);
	
	var item = $('<a>');
	item.css({borderBottom : '1px solid #d2d2d2'});
	item.addClass('row-fluid');
	
	var remove = $('<a>');
	remove.attr('href', '#');
	remove.attr('rel', 'tooltip');
	remove.attr('data-original-title', 'Remove');
	remove.tooltip({ placement:'left' });
	remove.append($('<i class=\"icon-remove-sign\">'));
	remove.click(function() {
		item.remove();
		sysrecommender.eval_recommendations[videoID] -= 1;
		sysrecommender.update_recommendation();
	});
	
	var videoImg = new Image();
	videoImg.src = MUSICKA.Properties.YT_THUMBNAIL_PATH + videoID + '/1.jpg';

	var thumbnail = $('<div>').addClass('span4').append(videoImg);
	item.append(thumbnail);
	
	var details = $('<div>').addClass('span8');
	item.append(details);
	
	var add = $('<a>');
	add.attr('href', '#');
	add.attr('rel', 'tooltip');
	add.attr('data-original-title', 'Add to playlist');
	add.tooltip({ placement:'left' });
	add.append($('<i class=\"icon-plus-sign\">'));
	add.click(function (){ 
		item.remove();
		sysrecommender.control._addSongModelView(videoID);
		sysrecommender.update_recommendation(); 
	});
	
	var rowControls = $('<div>');
	rowControls.addClass('pull-right');
	rowControls.append(add);
	rowControls.append(remove);
	details.append(rowControls);
	
	this.get_yt_info(function(data) {
		var title = $('<a>').html(data.title);
		title.attr('onClick', 'return false;');
		title.attr('href', '#');
		title.click(function(){ $('#'+MUSICKA.Properties.YTPLAYER)[0].loadVideoById(videoID); });
		details.append(title);
	}, videoID);
	
	item = $('<li>').append(item);
	column.append(item);
}

sysrecommender.get_yt_info = function(cb, videoID) {
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: function(response) {
			if(typeof response.feed.entry === 'undefined') {
				return;
			}
			cb({ title: response.feed.entry[0].title.$t });
		}
	});
}

/* AJAX */
sysrecommender.save_playlist_vector = function () {
	$.ajax({
		type	: 'post',
		url		: 'recommend/store',
		data	: {
			sr: session.signed,
			array: sysrecommender.playlist_vector.elements,
		},
		success	: function (response) {
			console.log("save : " + response);
		}
	});
}

sysrecommender.save_song_vector = function (id, song_vector) {
	console.log(id, song_vector);
	$.ajax({
		type	: 'post',
		url		: 'recommend/store_song_vector',
		data	: {
			id: id,
			array: song_vector.elements,
		},
		success	: function (response) {
			console.log("save song vec: " + response);
		}
	});
}

sysrecommender.retrieve_friends = function () {
	$.ajax({
		type	: 'post',
		url		: 'recommend/retrieve_friends',
		data	: {
			sr: session.signed,
			token: session.token,
		},
		success	: function (response) {
			console.log("retrieve friends: ", response);
			sysrecommender.process_playlists.bind(sysrecommender)(response);
			sysrecommender.start_recommendation.bind(sysrecommender)();
		}
	});
}

sysrecommender.get_friend_playlist = function (id) {
	$.ajax({
		type	: 'post',
		url		: 'recommend/get_friend_playlist',
		data	: {
			id: id,
		},
		success : function (response) {
			sysrecommender.retrieved += 1;
			console.log("getlist res: ", response);
			sysrecommender.friend_playlists[id] = response.playlist;
			sysrecommender.friend_song_vectors[id] = response.vectors;
			if (sysrecommender.retrieved == sysrecommender.toRetrieve) {
				sysrecommender.do_recommendation();
			}
		},
	});
}

