function Song(id, title, rate) {
	this.videoID	= null;
	this.title 		= title || '';
	this.rating		= 0;
	
	if(arguments.length >= 2) {
		this.rating = rate;
	}
	if(arguments.length >= 1) {
		this.videoID = id;
	}
}