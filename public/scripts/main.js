var clientController = null;

window.onload = function() {
	var clientModel = new MusicPlayer();
	clientController = new ClientControl(clientModel);

	clientController.init();
}