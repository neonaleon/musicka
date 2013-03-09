function RecTableControl(client) {
	this._client	= client;
	this._recList	= {};
	this._cellList	= [];
	this._view		= $('#MUSICKA.Element.RECOM_LIST_ID');
	
	this.onGetRequests();
}

RecTableControl.prototype.onGetRequests = function() {
	FB.api('/me/apprequests', function(response) {
		for(var i = 0; i < response.data.length; i++) {
			var req = response.data[i];
			if(this._contains(req.id)) {
				continue;
			}
			
			var model = new Recommend(req.data, req.id, req.from.name, req.from.id)
			this._recList[req.id] = model;
			var cell = new RecCellControl(this, model);
			this._cellList.push(cell);
			this._view.append(cell);
		}
	});
}

RecTableControl.prototype._contains = function(requestID) {
	if(typeof this._recList[requestID] !== 'undefined') {
		return true;
	}
	return false;
}

RecTableControl.prototype.onPlaySong = function(cell) {
	
}

RecTableControl.prototype.onRemoveSong = function(cell) {
	this._view.remove(cell.view);
	delete this._recList[cell._model._requestID];
	index = this._cellList.indexOf(cell);
	this._cellList.splice(index, 1);
	
	if(cell._model._requestID === null) {
		return;
	}
	FB.api(cell._model._requestID, 'delete', function(response) {
		console.log('Delete request', response);
	});
}

RecTableControl.prototype.onAddSong = function(cell) {
	this._client._addSongModelView(cell._model._videoID, 0);
	this.onRemoveSong(cell);
}