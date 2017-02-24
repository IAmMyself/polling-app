$("document").ready(function () {
	if (document.cookie != "") {
		try {
			$("#newOpt").css("display", "block");
			var user = document.cookie.split(";")[1].split("=")[1];
			if (user == $("#author").text().slice(12)){
				$("#delete").css("display", "block");
			}
		} catch (err) {
			console.log(err);
		}
	}
	
	function escapeJS(unsafe) {
		return unsafe
			.replace(/"/g, '\"')
			.replace(/'/g, "\'")
			.replace(/\$/g, "\$")
			.replace(/\\/g, "\\")
			.replace(/\./g, "_______PEROID_______");
	}
	
	var chart,
		data,
		options,
		vote;

	$(".go-home").click(function () {
		window.location.replace("/");
	});
	
	$("#user").click(function () {
		window.location.replace("/signin");
	});

	$(".option").click(function (event) {
		vote = escapeJS($(event.target).text());
		$('.option').not(this).each(function () {
			$(this).removeClass('clicked');
			$(this).addClass('unclicked');
		});
		$(this).addClass('clicked');
		$(this).removeClass('unclicked');
	});

	$(".submit").click(function () {
		$.ajax({
			type: "POST",
			url: "/voted",
			data: {
				name: document.title,
				vote: vote
			},
			success: function (data) {
				if (data.success) {
					stuff[numbers[vote]][1] += 1;
					$(".form").hide();
					draw();
				} else {
					document.getElementById("success").innerHTML = data.failMsg;
				}
			}
		});
	});
	
	$("#newOpt").on('submit', function (event) {
		event.preventDefault();
		console.log("Submitted");
		$.ajax({
			type: "POST",
			url: "https://my-poll-app.herokuapp.com/new/option",
			data: {
				name: document.getElementById("possibleOpt").value,
				poll: escapeJS(document.title)
			},
			success: function (data) {
				if (data.success) {
					window.location.reload(true);
				} else {
					document.getElementById("success").innerHTML = data.failMsg;
				}
			}
		});
	});
	
	$("#delete").click( function() {
		var check = prompt("This will irrevocably delete your poll, are you sure that you would like to continue?\nIf so, please enter: " + document.title, "Delete!");
		if (check == document.title) {
			$.ajax({
				type: "POST",
				url: "/delete",
				data: {
					name: document.title,
				},
				success: function (data) {
					if (data.success) {
						window.location.replace("/");
					} else {
						document.getElementById("success").innerHTML = data.failMsg;
					}
				}
			});
		} else {
			document.getElementById("success").innerHTML = "If you would like to delete this poll, you must enter the <b>EXACT</b> name. You did not, so the poll was <b> NOT </b> deleted.";
		}
	});

	function draw() {
		google.charts.load('current', {
			'packages': ['corechart']
		});

		google.charts.setOnLoadCallback(drawChart);

		function drawChart() {
			var slices = {};
			for (var i = 0; i < stuff.length; i++) {
				slices[i] = { offset: '0' };
			}
			// Create the data table.
			data = new google.visualization.DataTable();
			data.addColumn('string', 'Option');
			data.addColumn('number', 'Number of votes');
			data.addRows(stuff);

			// Set chart options
			options = {
				'title': document.title,
				backgroundColor: "#d4edf7",
				'width': Math.floor($(document).width() * 0.85),
				'height': Math.floor($(document).height() * 0.85),
				is3D: true,
				slices: slices
			};

			// Instantiate and draw our chart, passing in some options.
			chart = new google.visualization.PieChart(document.getElementById('myChart'));
			chart.draw(data, options);
			google.visualization.events.addListener(chart, 'onmouseover', explode);
			google.visualization.events.addListener(chart, 'onmouseout', andBack);
		}
		
		if (window.orientation) {
			$(window).orientationchange(function() {
				options.width = $(document).width() * 0.85;
				options.height = $(document).height() * 0.85;
				chart.draw(data, options);
			});
		} else {
			$(window).resize(function() {
				options.width = $(document).width() * 0.85;
				options.height = $(document).height() * 0.85;
				chart.draw(data, options);
			});
		}

		function explode(e) {
			if (options.slices[e.row].offset === '0') {
				options.slices[e.row] = {
					offset: '0.2'
				};
				chart.draw(data, options);
			}
		}

		function andBack(e) {
			options.slices[e.row] = {
				offset: '0'
			};
			chart.draw(data, options);
		}
	}
	
	if (document.cookie) {
		document.getElementById("user").innerHTML = '<p id="user3">Log out</p>';
		$("#user").click(function() {
		    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path='/';";
			document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path='/';";
			window.location.replace("/");
		});
	}
});