/** nest.js
 * @author neonaleon
 * this is an implementation of API for making requests to echonest
 * see documentation at http://developer.echonest.com/docs/v4/
 * TODO: maybe include some error handling in nest methods
 */

var nest = { 
	api_url: 'http://developer.echonest.com/api/v4/',
	api_key: "PMKV2PUZZ9ECJSAZ3",
	api_version: 4.2,
}

nest.list_genres = function(cb) {
	var url = nest._URLmake('artist', 'list_genres');
	$.ajax({
		type	: 'get',
		url		: url,
		success	: function(response) {
			// TODO: check status, handle errors
			cb(response.response.genres);
		},
	});
}

nest.list_style_terms = function(cb) {
	var url = nest._URLmake('artist', 'list_terms');
	url = nest._URLappend( url, 'type', 'style' );
	$.ajax({
		type	: 'get',
		url		: url,
		success	: function(response) {
			cb(response.response.terms);
		},
	});
}

nest.list_mood_terms = function(cb) {
	var url = nest._URLmake('artist', 'list_terms');
	url = nest._URLappend( url, 'type', 'mood' );
	$.ajax({
		type	: 'get',
		url		: url,
		success	: function(response) {
			cb(response.response.terms);
		},
	});
}

nest.search_song = function(params, cb, userData) {
	userData = userData || {};
	var url = nest._URLmake('song', 'search');
	url = nest._URLappend(url, 'bucket', 'audio_summary');
	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			url = nest._URLappend( url, key, encodeURIComponent(params[key]) );
		}
	}
	
	$.ajax({
		type	: 'get',
		url		: url,
		success	: function(response) {
			cb(response.response.songs[0], userData);
		},
	});
}

nest._URLmake = function(api_type, api_method) {
	return nest.api_url + api_type + '/' + api_method + '?api_key=' + nest.api_key;
}

nest._URLappend = function(url, key, value) {
	return url + '&' + key + '=' + value;
}
