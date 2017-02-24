$("document").ready(function () {
	
	$(".go-home").click(function () {
		window.location.replace("/");
	});
	
	$("#user").click(function () {
		window.location.replace("/signin");
	});

	$(".polls").click( function(event) {
		window.location.replace("/" + encodeURIComponent($(event.target).text()));
	});
	
	if (document.cookie) {
		document.getElementById("user").innerHTML = '<p style="background-color:#808080; font-size: 1.15em; border-radius: 10px; margin: 6px 1px 6px 1px; color: white">Log out</p>';
		$("#user").click(function() {
		    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path='/';";
			document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path='/';";
			window.location.replace("/");
		});
	}
})