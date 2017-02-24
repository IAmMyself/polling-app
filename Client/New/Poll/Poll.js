function escapeJS(unsafe) {
	return unsafe
		 .replace(/"/g, '\"')
		 .replace(/'/g, "\'")
		 .replace(/\\/g, "\\")
		 .replace(/\$/g, "\$")
		 .replace(/\./g, "_______PEROID_______");
}

function getOptions() {
	var holder = document.getElementsByClassName("option"),
		toReturn = [];
	for (var i = 0; i < holder.length; i++) {
		if (holder[i].value != undefined) {
			toReturn.push(holder[i].value);
		}
	}
	return toReturn;
}

$("document").ready(function () {

	$(".go-home").click(function () {
		window.location.replace("/");
	});
	
	$("#user").click(function () {
		window.location.replace("/signin");
	});

	$("#submit").click(function () {
		var options = getOptions();
		$.ajax({
			type: "POST",
			url: "https://my-poll-app.herokuapp.com/new/poll",
			data: {
				name: document.getElementById("poll-name").value,
				options: options
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

	$("#more").click(function () {
	  var options = getOptions(),
	    holder = document.getElementsByClassName("option");
		document.getElementById("options").innerHTML += '<input type="text" name="option" class="form-control option" placeholder="Input poll option">';
		for (var i = 0; i < options.length; i++) {
		  holder[i].value = options[i];
	  }
	});
	
	if (document.cookie) {
		document.getElementById("user").innerHTML = '<p style="background-color:#808080; font-size: 1.15em; border-radius: 10px; margin: 6px 1px 6px 1px; color: white">Log out</p>';
		$("#user").click(function() {
		    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path='/';";
			document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path='/';";
			window.location.replace("/");
		});
	}
});