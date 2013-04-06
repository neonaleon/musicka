function SearchModalControl(client, playlist) {
	this.MAX_RESULTS	= 10;
	this._client		= client;
	this._playlist		= playlist;
	this._cellList		= [];
	this._modalView		= $('#'+MUSICKA.Element.SEARCH_MODAL_ID);
	this._queryBtnView	= $('#'+MUSICKA.Element.MODAL_BTN_ID);
	this._queryView		= $('#'+MUSICKA.Element.MODAL_INPUT_ID);
	this._resultView	= $('#'+MUSICKA.Element.SEARCH_LIST_ID);
	
	this._queryBtnView.click(this._search.bind(this));
}

SearchModalControl.prototype.search = function(query) {
	this._modalView.modal('show');
	this._queryView[0].value = query;
	this._search();
}

SearchModalControl.prototype._search = function() {
	this._clearList();
	
	var self = this;
	$.ajax({
		dataType: 'jsonp',
		url: MUSICKA.Properties.YTPATH + "feeds/api/videos?format=5&alt=json-in-script&vq=" + self._queryView[0].value,
		success: function(response) {
			var results = response.feed.entry;
			if(typeof results === 'undefined') {
				control._alert('error', "No YouTube videos found");
				return;
			}
			
			for(var i = 0; i < results.length && i < self.MAX_RESULTS; i++) {
				var item = results[i];
				var cell = new SearchCellControl(self, new YTVideo(item));
				self._cellList.push(cell);
				self._resultView.append(cell.view);
			}
		}
	});
}

SearchModalControl.prototype._clearList = function() {
	this._cellList.length = 0;
	this._resultView.empty();
}
