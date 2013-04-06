function SearchCellControl(parent, model) {
	this._parent = parent;
	this._model = model;
	this.view = $('<li>');
	this._addBtnView = $('<button>');
	this._model.onload = this._initUI.bind(this);
}

SearchCellControl.prototype._initUI = function() {
	var content = $('<a>');
	content.css({borderBottom : '1px solid #d2d2d2'});
	content.addClass('row-fluid');
	this.view.append(content);
	
	var thumbnail = $('<div>').addClass('span4').append(this._model._videoImg);
	content.append(thumbnail);
	
	var details = $('<div>').addClass('span8');
	content.append(details);
	
	var title = $('<h4>').html(this._model._title);
	details.append(title);
	
	var line1 = $('<p>').html('by ' + this._model._uploader + ' * ' + this._model._viewCount + ' views');
	var line2 = $('<p>').html(this._model._describe);
	details.append(line1);
	details.append(line2);
	
	this._addBtnView.attr({'data-toggle': 'button', 'type': 'button'});
	this._addBtnView.addClass('btn btn-primary');
	this._addBtnView.click(this._onAddSong.bind(this));
	if(this._isAdded()) {
		this._addBtnView.html('Remove');
		this._addBtnView.button('toggle');
	} else {
		this._addBtnView.html('Add');
	}
	details.append(this._addBtnView);
}

SearchCellControl.prototype._onAddSong = function() {
	if(this._isAdded()) {
		this._parent._client._onRemoveSong(this._model._videoID);
		this._addBtnView.html('Add');
	} else {
		this._parent._client._addSongModelView(this._model._videoID);
		this._addBtnView.html('Remove');
	}
}

SearchCellControl.prototype._isAdded = function() {
	return this._parent._playlist.containsSong(this._model._videoID);
}
