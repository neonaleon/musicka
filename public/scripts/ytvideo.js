function YTVideo(videoID, requestID, from, fromID) {
	this._videoID	= videoID;
	
	this._videoImg	= null;
	this._title		= null;
	this._uploader	= null;
	this._viewCount	= 0;
	this._describe	= null;
	
	this._from		= null;
	this._fromID	= null;
	this._requestID	= '';
	
	this.onload		= null;
	this._loaded	= 0;
	
	if(typeof videoID === 'string') {
		this.setDataFromID(videoID);
	} else {
		this.setDataFromObject(videoID);
	} 
	if(arguments.length >= 2) {
		this._requestID = requestID;
	}
	if(arguments.length >= 4) {
		this._from = from;
		this._fromID = fromID;
	}
}

YTVideo.prototype.setDataFromID = function(videoID) {
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
			self._uploader	= response.feed.entry[0].author[0].name.$t;
			self._viewCount	= response.feed.entry[0].yt$statistics.viewCount;
			self._describe	= response.feed.entry[0].content.$t;
			self._loadDone();
		}
	});
}

YTVideo.prototype.setDataFromObject = function(data) {
	if(typeof data === 'undefined' || data === null) {
		return;
	}
	
	this._videoID = this._parseURL(data.link[0].href);
	this._videoImg = new Image();
	this._videoImg.src = MUSICKA.Properties.YT_THUMBNAIL_PATH + this._videoID + '/1.jpg';
	this._videoImg.onload = this._loadDone.bind(this);
	this._title = data.title.$t;
	this._uploader = data.author[0].name.$t;
	this._viewCount = data.yt$statistics.viewCount;
	this._describe = data.content.$t;
	this._loadDone();
}

YTVideo.prototype._loadDone = function() {
	this._loaded++;
	if(this._loaded >= 2) {
		this.onload();
	}
}

YTVideo.prototype._parseURL = function(url) {
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[1].length==11){
        return match[1];
    }else{
        return false;
    }
}
