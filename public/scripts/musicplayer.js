function MusicPlayer() {
	this.playList		= [];
	this._playListHash	= {};
	this.recommended	= [];
	this._current		= -1;	// Array index of current song
}

MusicPlayer.prototype.addSong = function(id, title, rate) {
	var song = new Song(id);
	this.playList.push(song);
	this._playListHash[id] = song;
	song.rating = rate || 0;
	song.title = title || 0;
	/* this was never fired....
	if(arguments >= 2) {
		song.rating = rate;
	}
	*/
}

MusicPlayer.prototype.containsSong = function(id) {
	if(typeof this._playListHash[id] === 'undefined') {
		return false;
	}
	return true;
}

MusicPlayer.prototype.removeSong = function(id) {
	var song = this._song(id);
	if(song === null) {
		return false;
	}
	var index = this.playList.indexOf(song);
	var nextSong = this.getNextSong();
	
	// Remove song from play list
	this.playList.splice(index, 1);
	delete this._playListHash[id];
	
	// Update current playing song
	if(this._current === index) {
		this._current = -1;
		return nextSong;
	}
	
	return false;
}
MusicPlayer.prototype.playSong = function(id) {
	var song = this._song(id);
	if(song !== null) {
		this._current = this.playList.indexOf(song);
	}
}

MusicPlayer.prototype.rateSong = function(id, rate) {
	var song = this._song(id);
	song.rating = rate;
}

MusicPlayer.prototype.getNextSong = function() {
	var next;
	if(this._current >= 0 && this._current < this.playList.length) {
		next = (this._current + 1) % this.playList.length; 
	} else if(this.playList.length > 0){
		next = 0;
	} else {
		return false;
	}
	return this.playList[next].videoID;
}

MusicPlayer.prototype.nowPlaying = function() {
	if(this._current >= 0) {
		return this.playList[this._current].videoID;
	}
	return false;
}

MusicPlayer.prototype._song = function(id) {
	if(typeof id === 'number') {
		return this.playList[id];
	} else if(typeof id === 'string') {
		return this._playListHash[id];
	}
	return null;
}