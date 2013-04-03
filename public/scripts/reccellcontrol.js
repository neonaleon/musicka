function RecCellControl(parent, model) {
	this._parent = parent;
	this._model = model;
	this.view = $('<li>');
	this._model.onload = this._initUI.bind(this);
}

RecCellControl.prototype._initUI = function() {
	var content = $('<a>');
	content.css({borderBottom : '1px solid #e2e2e2'});
	content.addClass('row-fluid');
	this.view.append(content);
	
	//this._model._videoImg.addClass('pull-left');
	//this._model._videoImg.addClass('img-polaroid');
	//content.append(this._model._videoImg);
	var thumbnail = $('<div>').addClass('span4').append(this._model._videoImg);
	content.append(thumbnail);
	
	var details = $('<div>').addClass('span8');
	content.append(details);
	
	var remove = $('<a>');
	remove.attr('href', '#');
	remove.attr('rel', 'tooltip');
	remove.attr('data-original-title', 'Remove');
	remove.tooltip({ placement:'right' });
	remove.append($('<i class=\"icon-remove-sign\">'));
	remove.click({ cell: this }, this._parent.onRemoveSong.bind(this._parent));
	
	var rowControls = $('<div>').append(remove);
	rowControls.addClass('pull-right');
	details.append(rowControls);
	
	var title = $('<a>').html(this._model._title);
	title.attr('onClick', 'return false;');
	title.attr('href', '#');
	//title.click({ cell: this }, this._parent.onPlaySong.bind(this._parent));
	title.click({ cell: this }, this._parent.onAddSong.bind(this._parent));
	details.append(title);
	
	/*var addSong = $('<a>').html('Add');
	addSong.attr('href', '#');
	addSong.attr('onClick', 'return false;');
	addSong.click({ cell: this }, this._parent.onAddSong.bind(this._parent));
	content.append(addSong);*/
	
	if(this._model._from !== null) {
		var sender = $('<div>').html('<br /> from ');
		var senderURL = $('<a>').html(this._model._from);
		senderURL.attr('href', '#');
		senderURL.click(function() {
			window.open(MUSICKA.Properties.FB_PATH + this._model._fromID, '_blank');
		});
		sender.append(senderURL);
		details.append(sender);
	}
}
