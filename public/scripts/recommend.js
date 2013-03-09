function Recommend(videoID, requestID, from, fromID) {
	this._videoID	= videoID;
	this._videoImg	= null;
	this._title		= null;
	this._from		= null;
	this._fromID	= null;
	this._requestID	= '';
	this.onload		= null;
	this._loaded	= 0;
	
	this.setVideo(videoID);
	if(arguments.length >= 2) {
		this._requestID = requestID;
	}
	if(arguments.length >= 4) {
		this._from = from;
		this._fromID = fromID;
	}
}

Recommend.prototype.setVideo = function(videoID) {
	if(typeof videoID === 'undefined' || videoID === null || videoID === '') {
		return;
	}
	
	this._videoID = videoID;
	this._videoImg = new Image();
	this._videoImg.src = MUSICKA.Properties.YT_THUMBNAIL_PATH + videoID + '/1.jpg';
	this._videoImg.onload = this._loadDone.bind(this);
	var self = this;
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: function(response) {
			if(typeof response.feed.entry === 'undefined') {
				return;
			}
			
			self._title = response.feed.entry[0].title.$t;
			self._loadDone();
		}
	});
}

Recommend.prototype._loadDone = function() {
	this._loaded++;
	if(this._loaded >= 2) {
		this.onload();
	}
}
