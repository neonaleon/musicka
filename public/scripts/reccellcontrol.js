function RecCellControl(parent, model) {
	this._parent = parent;
	this._model = model;
	this.view = $('<li>');
	this._model.onload = this._initUI.bind(this);
}

RecCellControl.prototype._initUI = function() {
	var content = $('<a>');
	content.css({borderBottom : '1px solid #d2d2d2'});
	content.addClass('row-fluid');
	this.view.append(content);
	
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
	
	var add = $('<a>');
	add.attr('href', '#');
	add.attr('rel', 'tooltip');
	add.attr('data-original-title', 'Add to playlist');
	add.tooltip({ placement:'right' });
	add.append($('<i class=\"icon-plus-sign\">'));
	add.click({ cell: this }, this._parent.onAddSong.bind(this._parent));
	
	var rowControls = $('<div>');
	rowControls.addClass('pull-right');
	rowControls.append(add);
	rowControls.append(remove);
	details.append(rowControls);
	
	var self = this;
	var title = $('<a>').html(this._model._title);
	title.attr('onClick', 'return false;');
	title.attr('href', '#');
	title.click(function(){ $('#'+MUSICKA.Properties.YTPLAYER)[0].loadVideoById(self._model._videoID); });
	//title.click({ cell: this }, this._parent.onAddSong.bind(this._parent));
	details.append(title);
	
	/*var addSong = $('<a>').html('Add');
	addSong.attr('href', '#');
	addSong.attr('onClick', 'return false;');
	addSong.click({ cell: this }, this._parent.onAddSong.bind(this._parent));
	content.append(addSong);*/
	
	if(this._model._from !== null) {
		var sender = $('<div>').html('<br /> from ');
		var senderURL = $('<a>').html(this._model._from);
		var senderID = this._model._fromID;
		senderURL.attr('href', '#');
		senderURL.click(function() {
			window.open(MUSICKA.Properties.FB_PATH + senderID, '_blank');
		});
		sender.append(senderURL);
		details.append(sender);
	}
}
