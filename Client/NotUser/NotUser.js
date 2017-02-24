$("document").ready(function () {
	$(".go-home").click(function () {
		window.location.replace("/");
	});
	
	$("#user").click(function () {
		window.location.replace("/signin");
	});
});