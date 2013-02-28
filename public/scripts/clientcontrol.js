function ClientControl(model) {
	this._model = model;
	this._player = null;
	
	// Bind YouTube callbacks
	var controller = this;
	window.handleYTStateChange = function (state) {
		controller.handleYTState(state);
	}
	window.onYouTubePlayerReady = function(playerId) {
		controller._player = $('#'+MUSICKA.Properties.YTPLAYER)[0];
		controller._player.addEventListener('onStateChange', 'handleYTStateChange');
	}
}

ClientControl.prototype.init = function() {
	// Load YouTube player
	var params = {allowScriptAccess : 'always'};
	var atts = {id : MUSICKA.Properties.YTPLAYER};
	swfobject.embedSWF('//www.youtube.com/v/Zhawgd0REhA?enablejsapi=1&playerapiid=ytplayer&version=3',
		MUSICKA.Element.YT_PLAYER_ID, '425', '356', '8', null, null, params, atts);
	
	// Load element functions
	$('#'+MUSICKA.Element.ADD_SONG_BTN_ID).click(this._onAddSong.bind(this));
}

ClientControl.prototype._onAddSong = function() {
	var inputField = $('#'+MUSICKA.Element.INPUT_FIELD_ID)[0];
	var videoID = this._parseURL(inputField.value);
	inputField.value = '';
	
	if(!videoID) {
		alert("Invalid YouTube Link");
		return;
	}
	
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: this._handleYTResponse.bind(this)
	});
}

ClientControl.prototype._handleYTResponse = function(response) {
	if(typeof response.feed.entry !== 'undefined') {
		// Video is available
		var videoID = this._parseURL(response.feed.entry[0].link[0].href);
		if(!this._model.containsSong(videoID)) {
			this._model.addSong(videoID);
			
			// Play video now if none are playing
			if(!this._model.nowPlaying()) {
				this._onPlaySong(videoID);
			}
			
			// Add row to html view
			var playList = $('#'+MUSICKA.Element.PLAYLIST_ID);
			var title = $('<a>').html(response.feed.entry[0].title.$t);
			title.attr('href', '#');
			title.attr('onClick', 'return false;');
			title.click({video: videoID}, this._onPlaySong.bind(this));
			title = $('<td>').append(title);
			var remove = $('<button class=\"btn\">').html("Remove");
			remove.click({video: videoID}, this._onRemoveSong.bind(this));
			remove = $('<td>').append(remove);
			var rating = $('<td>').html('0');
			var row = $('<tr>').append(title, rating, remove);
			row.attr('id', videoID);
			playList.append(row);
		}
	} else {
		alert("YouTube video does not exist");
	}
}

ClientControl.prototype._parseURL = function(url) {
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[1].length==11){
        return match[1];
    }else{
        return false;
    }
}

ClientControl.prototype._onPlaySong = function(id) {
	var videoID = id;
	if(typeof id !== 'string') {
		videoID = id.data.video;
	}
	
	if(videoID !== this._model.nowPlaying()) {
		this._model.playSong(videoID);
		this._player.loadVideoById(videoID);
	}
}

ClientControl.prototype._onRemoveSong = function(id) {
	var videoID = id;
	if(typeof id !== 'string') {
		videoID = id.data.video;
	}
	
	var nextSong = this._model.removeSong(videoID);
	if(nextSong) {
		this._onPlaySong(nextSong);
	}
	
	$('#'+videoID).remove();
}

ClientControl.prototype.handleYTState = function(state) {
	// On video end
	if(state === 0) {
		var videoID = this._model.getNextSong();
		if(videoID) {
			this._onPlaySong(videoID);
		}
	}
}
