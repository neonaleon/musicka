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
		
		// Play first video now
		var nextSong = controller._model.getNextSong();
		if(!controller._model.nowPlaying() && nextSong) {
			controller._onPlaySong(nextSong);
		}
	}
}

ClientControl.prototype.init = function() {
	// Load YouTube player
	var params = {allowScriptAccess : 'always', scale : 'exactfit'};
	var atts = {id : MUSICKA.Properties.YTPLAYER};
	swfobject.embedSWF('//www.youtube.com/v/' + MUSICKA.Properties.YTPLAYER_DEFAULT_VIDEOID + '?enablejsapi=1&playerapiid=ytplayer&version=3',
		MUSICKA.Element.YT_PLAYER_ID,
		MUSICKA.Properties.YTPLAYER_WIDTH,
		MUSICKA.Properties.YTPLAYER_HEIGHT,
		'8', null, null, params, atts);
	
	// Load element functions
	$('#'+MUSICKA.Element.ADD_SONG_BTN_ID).click(this._onAddSong.bind(this));
	
	// Retrieve playlist from server
	this._getMyPlaylist();
}

ClientControl.prototype._addSongModelView = function(videoID, rating, informServer) {
	var inform = informServer;
	var rate = rating || 0;
	if(arguments.length < 3) {
		inform = true;
	}
	
	var control = this;
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: function(response) {
			if(typeof response.feed.entry !== 'undefined') {
				// Video is available
				var videoID = control._parseURL(response.feed.entry[0].link[0].href);
				if(!control._model.containsSong(videoID)) {
					control._model.addSong(videoID);
					
					// Play video now if none are playing
					if(!control._model.nowPlaying()) {
						control._onPlaySong(videoID);
					}
					
					// Add row to html view
					var playList = $('#'+MUSICKA.Element.PLAYLIST_ID);
					var title = $('<a>').html(response.feed.entry[0].title.$t);
					title.attr('href', '#');
					title.attr('onClick', 'return false;');
					title.click({video: videoID}, control._onPlaySong.bind(control));
					title = $('<td>').append(title);
					var remove = $('<button class=\"btn btn-primary\">').html("Remove");
					remove.click({video: videoID}, control._onRemoveSong.bind(control));
					remove = $('<td>').append(remove);
					var rating = $('<td>').html(rate);
					var row = $('<tr>').append(title, rating, remove);
					row.attr('id', videoID);
					playList.append(row);
					
					// Inform server of added song
					if(!inform) {
						return;
					}
					$.ajax({
						dataType : 'POST',
						url : "add",
						data : {video: videoID, fbid: session.userID}
					});
				}
			} else {
				this._alert('error', "YouTube video does not exist");
			}
		}
	});
}

ClientControl.prototype._onAddSong = function() {
	var inputField = $('#'+MUSICKA.Element.INPUT_FIELD_ID)[0];
	var videoID = this._parseURL(inputField.value);
	inputField.value = '';
	
	if(!videoID) {
		this._alert('error', "Invalid YouTube Link");
		return;
	}
	
	this._addSongModelView(videoID);
}

ClientControl.prototype._onRateSong = function(rate) {
	$.ajax({
		dataType : 'POST',
		url : "rate",
			data : {video: videoID, fbid: session.userID, rate: rate}
	});
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

ClientControl.prototype._getMyPlaylist = function() {
	var control = this;
	
	$.ajax({
		type		: 'post',
		url			: "getlist",
		data		: {fbid: session.userID},
		success		: function(response) {
			for(var i = 0; i < response.list.length; i++) {
				// Add each song
				var videoID = response.list[i].v;
				var rating = response.list[i].r;
				control._addSongModelView(videoID, rating, false);
			}
			var firstSong = response.list[0].v || null;
			
			// Play first video now
			if(!control._model.nowPlaying() && firstSong) {
				control._onPlaySong(firstSong);
			}
		}
	});
}

ClientControl.prototype._onPlaySong = function(id) {
	var videoID = id;
	if(typeof id !== 'string') {
		videoID = id.data.video;
	}
	
	if(videoID !== this._model.nowPlaying() && this._player) {
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
	
	// Inform server of removed song
	$.ajax({
		dataType : 'POST',
		url : "remove",
		data : {video: videoID, fbid: session.userID}
	});
}

ClientControl.prototype._alert = function(alertType, alertText) {
	var alertArea = $('#'+MUSICKA.Element.ALERT_ID);
	var alert = $('<div class=\"span10 alert alert-' + alertType + '\">')
				.append($('<button type=\"button\" class=\"close\" data-dismiss=\"alert\">').html('&times;'))
				.append($('<p>').html(alertText));
	alertArea.append(alert);
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
