window.fbAsyncInit = function() {
	// init the FB JS SDK
	FB.init({
		appId : '537482629624950',
		channelUrl : 'channel.html',
		status : true,
		cookie : true,
		xfbml : true
	});

	/*FB.Event.subscribe('auth.login', function(response) {
		if (response.status === 'connected') {
			//alert('fb client connected');
			session.userID = response.authResponse.userID;
			if(!session.isControlInit && clientController) {
				clientController.init();
				session.isControlInit = true;
			}
		} else if (response.status === 'not_authorized') {
			//alert('fb client not auth');
			//login();
		} else {
			//alert('fb client not logged in');
			// not_logged_in
			//login();
		}
	});*/
	
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			alert('fb client connected');
			session.userID = response.authResponse.userID;
			if(!session.isControlInit && clientController) {
				clientController.init();
				session.isControlInit = true;
			}
		} else if (response.status === 'not_authorized') {
			alert('fb client not auth');
			login();
		} else {
			alert('fb client not logged in');
			// not_logged_in
			login();
		}
	});
	
	FB.Canvas.setAutoGrow();
};

( function(d, debug) {
		var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement('script');
		js.id = id;
		js.async = true;
		js.src = "//connect.facebook.net/en_US/all" + ( debug ? "/debug" : "") + ".js";
		ref.parentNode.insertBefore(js, ref);
	}(document, /*debug*/false));
	
function login() {
	top.location = "https://www.facebook.com/dialog/oauth?client_id=537482629624950&redirect_uri="+window.location;
}

var session = {
	userID 			: null,
	isControlInit	: false
}
