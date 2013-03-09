function RecTableControl(client) {
	this._client	= client;
	this._recList	= {};
	this._cellList	= [];
	this._view		= $('#'+MUSICKA.Element.RECOM_LIST_ID);
	
	var self = this;
	this.onGetRequests();
	setInterval(this.onGetRequests.bind(self), 15000);
}

RecTableControl.prototype.onGetRequests = function() {
	var self = this;
	FB.api('/me/apprequests', function(response) {
		for(var i = 0; i < response.data.length; i++) {
			var req = response.data[i];
			if(self._contains(req.id)) {
				continue;
			}
			
			var model = new Recommend(req.data, req.id, req.from.name, req.from.id);
			model.onload = function() {
				var cell = new RecCellControl(self, model);
				self._cellList.push(cell);
				self._view.append(cell.view);
			};
			self._recList[req.id] = model;
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
	if(!(cell instanceof RecCellControl)) {
		cell = cell.data.cell;
	}
	
	// TODO on click title
}

RecTableControl.prototype.onRemoveSong = function(cell) {
	if(!(cell instanceof RecCellControl)) {
		cell = cell.data.cell;
	}
	
	delete this._recList[cell._model._requestID];
	index = this._cellList.indexOf(cell);
	this._cellList.splice(index, 1);
	cell.view.remove();
	
	if(cell._model._requestID === null) {
		return;
	}
	FB.api(cell._model._requestID, 'delete', function(response) {
		
	});
}

RecTableControl.prototype.onAddSong = function(cell) {
	if(!(cell instanceof RecCellControl)) {
		cell = cell.data.cell;
	}
	this._client._addSongModelView(cell._model._videoID, 0);
	this.onRemoveSong(cell);
}