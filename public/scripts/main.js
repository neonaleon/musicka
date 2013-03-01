var clientController = null;

window.onload = function() {
	var clientModel = new MusicPlayer();
	clientController = new ClientControl(clientModel);

	if(!session.isControlInit && session.userID) {
		clientController.init();
		session.isControlInit = true;
	}
}