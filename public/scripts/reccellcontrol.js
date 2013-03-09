function RecCellControl(parent, model) {
	this._parent = parent;
	this._model = model;
	this.view = $('<li>');
	this._model.onload = this._initUI.bind(this);
}

RecCellControl.prototype._initUI = function() {
	// TODO fix UI
	var thumbnail = $('<div>').append(this._model._videoImg);
	thumbnail.addClass('pull-left');
	this.view.append(thumbnail);
	
	var remove = $('<a>');
	remove.attr('href', '#');
	remove.attr('rel', 'tooltip');
	remove.attr('data-original-title', 'Remove');
	remove.tooltip({ placement:'right' });
	remove.append($('<i class=\"icon-remove-sign\">'));
	remove.click({ cell: this }, this._parent.onRemoveSong.bind(this._parent));
	
	var title = $('<a>').html(this._model._title);
	title.attr('onClick', 'return false;');
	title.attr('href', '#');
	title.click({ cell: this }, this._parent.onPlaySong.bind(this._parent));
	this.view.append(title);
	
	var rowControls = $('<div>').append(remove);
	rowControls.addClass('pull-right');
	this.view.append(rowControls);
	
	var addSong = $('<a>').html('Add');
	addSong.attr('href', '#');
	addSong.attr('onClick', 'return false;');
	addSong.click({ cell: this }, this._parent.onAddSong.bind(this._parent));
	this.view.append(addSong);
	
	if(this._model._from === null) {
		return;
	}
	
	var sender = $('<div>').html('from ');
	var senderURL = $('<a>').html(this._model._from);
	senderURL.attr('href', '#');
	senderURL.click(function() {
		window.open(MUSICKA.Properties.FB_PATH + this._model._fromID, '_blank');
	});
	sender.append(senderURL);
	this.view.append(sender);
}
