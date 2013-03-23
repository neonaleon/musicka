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
	friend_playlist_vectors: undefined, // userID: playlist vector
	
	recommend_interval: 5000, // update recommendations every .. seconds
}

sysrecommender.init = function (model) {
	this.model = model;
	this.build_playlist_vector();
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
	for (var k in res_json) {
		this.friend_similarity.push( [ this.cosine_similarity( res_json[k] ), k ] );
	}
	this.friend_similarity.sort( function(a, b){ return a[0] - b[0]; } );
	console.log("processed playlists: ", friend_similarity);
}

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

sysrecommender.retrieve_playlist_vector = function ( userID ) {
	$.ajax({
		type	: 'post',
		url		: 'recommend/retrieve',
		data	: {
			sr: session.userID,
		},
		success	: function (response) {
			console.log("retrieve : ", response);	
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
			sysrecommender.do_recommendation.bind(sysrecommender)();
		}
	});
}

sysrecommender.update_recommendation = function () {
	this.norm_playlist_vector = this.playlist_vector.toUnitVector();
	this.retrieve_friends();
}

sysrecommender.recommend = function () {
	this.update_recommendation();
	setTimeout(function() { sysrecommender.recommend(); }, sysrecommender.recommend_interval);
}
