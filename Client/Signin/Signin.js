$("document").ready(function () {

	$(".go-home").click(function () {
		window.location.replace("/");
	});
	
	$("#user").click(function () {
		window.location.replace("/signin");
	});

	$("#login").on('submit', function (event) {
		event.preventDefault();
		$.ajax({
			type: "POST",
			url: "https://my-poll-app.herokuapp.com/signin",
			data: {
				username: document.getElementById("username").value,
				password: document.getElementById("password").value
			},
			success: function (data) {
				if (data.success) {
					window.location.replace("/");
				} else {
					document.getElementById("success").innerHTML = data.failMsg;
				}
			}
		});
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