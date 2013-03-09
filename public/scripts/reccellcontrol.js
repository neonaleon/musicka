function RecCellControl(parent, model) {
	this._parent = parent;
	this._model = model;
	this.view = $('<li>');
	
	// TODO fix UI
	var thumbnail = $('<div>').append(model._videoImg);
	thumbnail.addClass('pull-left');
	this.view.append(thumbnail);
	
	var remove = $('<a>');
	remove.attr('href', '#');
	remove.attr('rel', 'tooltip');
	remove.attr('data-original-title', 'Remove');
	remove.tooltip({ placement:'right' });
	remove.append($('<i class=\"icon-remove-sign\">'));
	remove.click({ cell: this }, parent.onRemoveSong.bind(parent));
	
	var title = $('<a>').html(model._title);
	title.attr('onClick', 'return false;');
	title.attr('href', '#');
	title.click({ cell: this }, parent.onPlaySong.bind(parent));
	this.view.append(title);
	
	var rowControls = $('<div>').append(remove);
	rowControls.addClass('pull-right');
	this.view.append(rowControls);
	
	var addSong = $('<a>').html('Add');
	addSong.attr('href', '#');
	addSong.attr('onClick', 'return false;');
	addSong.click({ cell: this }, parent.onAddSong.bind(parent));
	this.view.append(addSong);
	
	if(model._from === null) {
		return;
	}
	
	var sender = $('<div>').html('from ');
	var senderURL = $('<a>').html(model._from);
	senderURL.attr('href', '#');
	senderURL.click(function() {
		window.open(MUSICKA.Properties.FB_PATH + model._fromID, '_blank');
	});
	sender.append(senderURL);
	this.view.append(sender);
}