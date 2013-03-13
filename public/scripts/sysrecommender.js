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
}

sysrecommender.init = function (model) {
	this.model = model;
	this.build_playlist_vector();
}

sysrecommender.build_playlist_vector = function () {
	this.playlist_vector = Vector.Zero(this.num_acoustic_attributes * this.num_equivalence_classes);
	for (var i in this.model.playList) {
		var song_obj = this.model.playList[i];
		nest.search_song({ combined: song_obj.title, results: 1 }, sysrecommender.on_add_song.bind(sysrecommender), { song: song_obj });
	}
}

sysrecommender.add_song = function (song_id) {
	var song_obj = this.model._song(song_id);
	nest.search_song({ combined: song_obj.title, results: 1 }, sysrecommender.on_add_song.bind(sysrecommender), { song: song_obj });
}

sysrecommender.on_add_song = function (response, userData) {
	var song_vector = this.extract_song_data(response);
	this.song_vectors[userData.song.id] = song_vector;
	this.playlist_vector = this.playlist_vector.add(song_vector);
}

sysrecommender.extract_song_data = function (song_info) {
	console.log(song_info);
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
	this.playlist_vector = this.playlist_vector.subtract(this.song_vectors[song_id]);
	delete this.song_vectors[song_id];
}

sysrecommender.get_recommendation = function () {
	// TODO: algo to compute recommendation
}




