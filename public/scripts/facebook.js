window.fbAsyncInit = function() {
	// init the FB JS SDK
	FB.init({
		appId : MUSICKA.Properties.APP_ID,
		channelUrl : MUSICKA.Properties.APP_DOMAIN + 'channel.html',
		status : true,
		cookie : true,
		xfbml : true
	});

	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			//alert('fb client connected');
			session.userID	= response.authResponse.userID;
			session.token	= response.authResponse.accessToken;
			if(clientController) {
				clientController.init();
			}
		} else if (response.status === 'not_authorized') {
			//alert('fb client not auth');
			login();
		} else {
			//alert('fb client not logged in');
			login();
		}
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
	FB.login(function(response) {
		if (response.authResponse) {
			// connected
			session.userID = response.authResponse.userID;
			if(clientController) {
				clientController.init();
			}
		} else {
			// cancelled
			window.location = window.location;
		}
	});
}

var session = {
	userID	: null,
	token	: null,
}
