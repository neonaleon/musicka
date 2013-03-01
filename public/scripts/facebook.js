window.fbAsyncInit = function() {
	// init the FB JS SDK
	FB.init({
		appId : '528686930488180',
		channelUrl : '//localhost:3000/channel.html',
		status : true,
		cookie : true,
		xfbml : true
	});

	FB.Canvas.setAutoGrow();
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			session.userID = response.authResponse.userID;
		} else if (response.status === 'not_authorized') {
			//login();
		} else {
			// not_logged_in
			//login();
		}
	});
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
	
/*function login() {
	FB.login(function(response) {
		if (response.authResponse) {
			// connected
		} else {
			// cancelled
		}
	});
}*/

var session = {
	userID : null
}
