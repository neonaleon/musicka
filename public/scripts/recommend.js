function Recommend(videoID, requestID, from, fromURL) {
	this._videoID	= videoID;
	this._videoImg	= null;
	this._title		= null;
	this._from		= null;
	this._fromURL	= null;
	this._requestID	= '';
	
	this.setVideo(videoID);
	if(arguments.length >= 2) {
		this._requestID = requestID;
	}
	if(arguments.length >= 4) {
		this._from = from;
		this._fromURL = fromURL;
	}
}

Recommend.prototype.setVideo = function(videoID) {
	if(typeof videoID === 'undefined' || videoID === null || videoID === '') {
		return;
	}
	
	this._videoID = videoID;
	this._videoImg = new Image();
	this._videoImg.src = MUSICKA.Properties.YT_THUMBNAIL_PATH + videoID + '/1.jpg';
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + videoID,
		success: function(response) {
			if(typeof response.feed.entry === 'undefined') {
				return;
			}
			
			this._title = response.feed.entry[0].title.$t;
		}
	});
}
