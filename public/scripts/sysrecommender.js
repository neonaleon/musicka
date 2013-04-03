/**
 * @author neonaleon
 */

var sysrecommender = {
	model: undefined,
	playlist_vector: undefined,
	norm_playlist_vector: undefined,
	song_vectors: {},
	
	acoustic_attributes: ['danceability', 'energy', 'speechiness'],
	num_acoustic_attributes: 3,
	num_equivalence_classes: 10,
	
	friend_similarity: [], // [(cosine similarity, userID)]
	friend_playlists: {}, // { userID : [ songIDs ] }
	
	recommend_interval: 5000, // update recommendations every 30 seconds

	topN_friends: 5,
	topN_songs: 1, // randomly show 1 song in topN users' playlist
	
	toRetrieve: 0,
	retrieved: 0,
	
	focused: true,
	
	similar_recommendations: [],
	recommendations: [],
}

sysrecommender.init = function (model) {
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
	this.song_vectors[userData.song.id] = song_vector;
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
		for (var j = 0; j < this.topN_songs; j++) {
			this.recommendations[ i * this.topN_songs + j ] = this.friend_playlists[friend_id][Math.floor(Math.random() * this.friend_playlists[friend_id].length)];
		}
	}
	this.end_recommendation();
}

sysrecommender.end_recommendation = function () {
	/* end the recommendation by showing the UI */
	// jquery the document
	// draw the ui
	var lreclist = $('#LRecList');
	var rreclist = $('#RRecList');
	lreclist.children().remove();
	rreclist.children().remove();
	for (var i in this.similar_recommendations) {
		
	}
	for (var j in this.recommendations) {
		this.make_recommendation_item('RRecList', this.recommendations[j]);
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
	item.addClass('clearfix');
	column.append(item);
	
	var remove = $('<a>');
	remove.attr('href', '#');
	remove.attr('rel', 'tooltip');
	remove.attr('data-original-title', 'Remove');
	remove.tooltip({ placement:'right' });
	remove.append($('<i class=\"icon-remove-sign\">'));
	remove.click(function() { item.remove(); });

	var rowControls = $('<div>').append(remove);
	rowControls.addClass('pull-right');
	item.append(rowControls);
	
	var videoImg = new Image();
	videoImg.src = MUSICKA.Properties.YT_THUMBNAIL_PATH + videoID + '/1.jpg';
	videoImg.addClass('img-polaroid');
	videoImg.addClass('pull-left');
	item.append(thumbnail);
	//var thumbnail = $('<div>').append(videoImg);
	//thumbnail.addClass('pull-left');
	//item.append(thumbnail);
	
	this.get_yt_info(item, videoID);
}

sysrecommender.get_yt_info = function(item, videoID) {
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: function(response) {
			if(typeof response.feed.entry === 'undefined') {
				return;
			}
			var title = $('<a>').html(response.feed.entry[0].title.$t);
			title.attr('onClick', 'return false;');
			title.attr('href', '#');
			item.append(title);
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
			sysrecommender.friend_playlists[id] = response.playlist;
			if (sysrecommender.retrieved == sysrecommender.toRetrieve)
				sysrecommender.do_recommendation();
		},
	});
}

