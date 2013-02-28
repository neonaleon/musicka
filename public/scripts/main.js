window.onload = function() {
	var clientModel = new MusicPlayer();
	var clientController = new ClientControl(clientModel);

	clientController.init();
}
