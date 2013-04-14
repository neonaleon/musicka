function ClientControl(model) {
	this._model = model;
	this._player = null;
	this._searchController = null;
	this.toLoad = 0; // the number of songs in the playlist to load on init
	this._isInit = false;
	
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
	if(this._isInit || session.userID === null) {
		return;
	}
	
	var self = this;
	// Inform server of new token
	/*$.ajax({
		type		: 'post',
		url			: "/auth/facebook",
		data		: {fbid: session.userID, token: session.token},
		success		: function(response) {
			console.log("Access token updated");
			/*for (var i in requests) {
				console.log('!requesting!', requests[i] + '_' + session.userID);
				FB.api(requests[i] + '_' + session.userID,
					function( response ) {
						console.log(response);
					});
			};
		}
	});*/
	
	//console.log('!!!', document.URL);
	var query = document.location.search.substring(1).split('&');
	var args = {};

	for (i=0; i < query.length; i++) {
	    var arg = decodeURI(query[i]);
	
	    if (arg.indexOf('=') == -1) {
	        args[arg.trim()] = true;
	    } else {
	        var kvp = arg.split('=');
	        args[kvp[0].trim()] = kvp[1].trim();
	    }
	}
	
	var starting_video = MUSICKA.Properties.YTPLAYER_DEFAULT_VIDEOID;
	
	// Load YouTube player
	var params = {allowScriptAccess : 'always', scale : 'exactfit'};
	var atts = {id : MUSICKA.Properties.YTPLAYER};
	swfobject.embedSWF('//www.youtube.com/v/' + starting_video + '?enablejsapi=1&playerapiid=ytplayer&version=3',
		MUSICKA.Element.YT_PLAYER_ID,
		MUSICKA.Properties.YTPLAYER_WIDTH,
		MUSICKA.Properties.YTPLAYER_HEIGHT,
		'8', null, null, params, atts);
	
	// Load element functions
	$('#'+MUSICKA.Element.SEARCH_BTN_ID).click(this._onSearchSong.bind(this));
	$('#'+MUSICKA.Element.SEARCH_FIELD_ID).keydown(function(event) {
		if(event.keyCode == 13) {
			event.preventDefault();
			return false;
		}
	});
	$('#'+MUSICKA.Element.SEARCH_FIELD_ID).keyup(function(event) {
		if(event.keyCode == 13) {
			$('#'+MUSICKA.Element.SEARCH_BTN_ID).click();
		}
	});
	$('input.rateStar').rating({ callback: self._rateSong.bind(this) });
	
	// Set elements to same height as embedded video player
	//$('#playListDiv').css('height', document.body.offsetHeight*0.5);
    //$('#recommendListDiv').css('height', document.body.offsetHeight*0.5);
    var h = $('#'+MUSICKA.Properties.YTPLAYER).css('height');
   	$('#'+MUSICKA.Element.RECOM_LIST_ID+'Div').css('height', 200);
    $('#'+MUSICKA.Element.SYSRECOM_LIST_ID+'Div').css('height', 200);
    $('#'+MUSICKA.Element.PLAYLIST_ID+'Div').css('height', h);

	// Retrieve playlist from server
	this._getMyPlaylist();
	
	// TODO Test recommendations
	//this._getRecommend();
	
	// Add view controllers
	var requestController = new RecTableControl(this);
	this._searchController = new SearchModalControl(this, this._model);
	
	this._isInit = true;
}

/*
ClientControl.prototype._getRecommend = function(n) {
	var count = n || 1;
	$.ajax({
		type		: 'post',
		url			: "recommend",
		data		: {fbid: session.userID, n: count},
		success		: function(response) {
			var list = [];
			for(var i = 0; i < response.list.length; i++) {
				// Add each recommendation
				var videoID = response.list[i];
				list.push(videoID);
			}
			console.log(list);
		}
	});
}
*/
ClientControl.prototype._addSongModelView = function(videoID, rating, informServer) {
	var inform = informServer;
	var rate = rating || 0;
	if(arguments.length < 3) {
		inform = true;
	}

	var self = this;
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: function(response) {
			if(typeof response.feed.entry === 'undefined') {
				self._alert('error', "YouTube video does not exist");
				return;
			}
			
			// Video is available
			var videoID = self._parseURL(response.feed.entry[0].link[0].href);
			if(self._model.containsSong(videoID)) {
				return;
			}
			
			self._model.addSong(videoID, response.feed.entry[0].title.$t, rate);
			// Play video now if none are playing
			if(!self._model.nowPlaying()) {
				self._onPlaySong(videoID);
			}
			
			// Add row to html view
			var playList = $('#'+MUSICKA.Element.PLAYLIST_ID);
			
			var row = $('<li>');
			row.attr('id', videoID);
			
			var title = $('<a>').html(response.feed.entry[0].title.$t);
			title.attr('href', response.feed.entry[0].link[0].href);
			title.attr('onClick', 'return false;');
			title.click({video: videoID}, self._onPlaySong.bind(self));
			row.append(title);
			
			var recommend = $('<a>');
			recommend.attr('href', '#');
			recommend.attr('rel', 'tooltip');
			recommend.attr('data-original-title', 'Recommend to a friend');
			recommend.append($('<i class=\"icon-user\">'));
			recommend.tooltip({ placement: 'right' });
			recommend.click({ video: videoID }, self._recommendSong.bind(self));
			
			var remove = $('<a>');
			remove.attr('href', '#');
			remove.attr('rel', 'tooltip');
			remove.attr('data-original-title', 'Delete');
			remove.tooltip({ placement:'right' });
			remove.append($('<i class=\"icon-trash\">'));
			remove.click({ video: videoID }, self._removeSong.bind(self));
			
			var rowControls = $('<div>').append(recommend, remove);
			rowControls.addClass('pull-right');
			title.prepend(rowControls);
			
			playList.append(row);
			
			self.toLoad -= 1;
			if (self.toLoad == 0) { self._onInitLoad(); }
			
			// Inform server of added song
			if(!inform) {
				return;
			}
			$.ajax({
				dataType : 'POST',
				url : "add",
				data : {video: videoID, sr: session.signed}
			});
		}
	});
}

ClientControl.prototype._onSearchSong = function() {
	var query = $('#'+MUSICKA.Element.SEARCH_FIELD_ID)[0].value;
	query = $.trim(query);
	if(query == '') {
		return;
	}
	var videoID = this._parseURL(query);
	
	if(!videoID) {
		this._searchController.search(query);
	} else {
		this._searchController.search(videoID);
	}
}

ClientControl.prototype._onRateSong = function(videoID, rate) {
	var self = this;
	$.ajax({
		type : 'post',
		url : "rate",
		data : {video: videoID, sr: session.signed, rate: rate},
		success: function () {
			self._model.rateSong(videoID, rate);
		},
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
		data		: {sr: session.signed},
		success		: function(response) {
			control.toLoad = response.list.length;
			for(var i = 0; i < response.list.length; i++) {
				// Add each song
				var videoID = response.list[i].v;
				var rating = response.list[i].r;
				control._addSongModelView(videoID, rating, false);
			}
			var firstSong = response.list[0] || null;
			
			// Play first video now
			if(!control._model.nowPlaying() && firstSong) {
				control._onPlaySong(firstSong.v);
			}
		}
	});
}

ClientControl.prototype._onInitLoad = function () {
	sysrecommender.init(this, this._model);
}

ClientControl.prototype._onPlaySong = function(id) {
	var videoID = id;
	if(typeof id !== 'string') {
		videoID = id.data.video;
	}
	
	if(videoID !== this._model.nowPlaying() && this._player) {
		this._model.playSong(videoID);
		this._player.loadVideoById(videoID);
		this._updateRating(videoID);
		this._updatePlaylist(videoID);
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
		data : {video: videoID, sr: session.signed}
	});
}

ClientControl.prototype._removeSong = function (id) {
	var videoID = id;
	if(typeof id !== 'string') {
		id.stopPropagation();
		videoID = id.data.video;
	}
	var self = this;
	this._alertChoice('warning', 'Remove \"' + self._model._song(videoID).title + '\" from playlist?', 'Yes', 'No', {video:videoID} , self._onRemoveSong.bind(self));
}

ClientControl.prototype._recommendSong = function (id) {
	var videoID = id;
	if(typeof id !== 'string') {
		id.stopPropagation();
		videoID = id.data.video;
	}
	this._showRecommendationDialog(videoID);
}

ClientControl.prototype._showRecommendationDialog = function (id) {
	var self = this;
	FB.ui({ method: 'apprequests',
			title: 'Recommend',
			message: "I'm recommending this song \"" + self._model._song(id).title + "\" to you. Hope you like it!",
			filters: ['app_users', 'all', 'app_non_users'],
			data: id, // could send YouTube URL here? http://developers.facebook.com/docs/reference/dialogs/requests/
			}, requestCallback);
}

function requestCallback( response ) {
	if (response == null) {
		return;
	} else {
		
	}
	console.log(response);
}

ClientControl.prototype._rateSong = function(value, link) {
	value = parseInt(value) || 0;
	this._onRateSong(this._model.nowPlaying(), value);
}

ClientControl.prototype._updateRating = function(id) {
	var index = this._model._song(id).rating - 1;
	if (index == -1) $('input').rating('drain');
	else $('input.rateStar').rating('select', index);
}

ClientControl.prototype._updatePlaylist = function(id) {
	$('li.active').removeClass('active');
	$('#'+id).addClass('active');
}

ClientControl.prototype._alert = function(alertType, alertText) {
	$('.alert').alert('close');
	var alertArea = $('#'+MUSICKA.Element.ALERT_ID);
	var row = $('<div class=\"row-fluid\">');
	var alert = $('<div class=\"span10 alert alert-' + alertType + '\">').html(alertText);
	var close = $('<button type=\"button\" class=\"close\" data-dismiss=\"alert\">').html('&times;');
	alertArea.append(row.append(alert.append(close)));
}

ClientControl.prototype._alertChoice = function(alertType, alertText, yesText, noText, data, handler) {
	$('.alert').alert('close');
	var alertArea = $('#'+MUSICKA.Element.ALERT_ID);
	var row = $('<div class=\"row-fluid\">');
	var alert = $('<div class=\"span10 alert alert-' + alertType + '\">').html(alertText);
	var p = $('<p>');
	var yesBtn = $('<a class=\"btn btn-primary \">').html(yesText);
	var noBtn = $('<a class=\"btn\">').html(noText);
	yesBtn.click(data, handler);
	yesBtn.click(function(){$('.alert').alert('close')});
	noBtn.click(function(){$('.alert').alert('close')});
	alertArea.append(alert.append(p.append(yesBtn, noBtn)));
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
