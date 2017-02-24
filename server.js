var express = require("express"),
	nunjucks = require("nunjucks"),
	jwt = require("jsonwebtoken"),
	crypto = require("crypto"),
	mongo = require('mongodb').MongoClient,
	url = process.env.MONGOLAB_URI,
	app = express();

//function to check that user is valid
function check(user, res, callback) {
	if (typeof callback != "function") {
		return false;
	}
	try {
		mongo.connect(url, function(err, db) {
			if (err != undefined) {
				console.log(err.message);
				callback({success: false, failMsg: "Apologies, the user database is currently unreachable."}, res);
			} else {
				db.collection("users").findOne({ _id: user["_id"] }, function (err, userReal) {
					if (err != undefined) {
						console.log(err.message);
					}
					if (userReal != null && user.hash == userReal.hash) {
						callback({success: true}, res);
					} else {
						res.clearCookie("token");
						res.clearCookie("user");
						callback({success: false, failMsg: "Invalid token. Please re-login."}, res);
					}
				});
			}
		});
	} catch (err) {
		console.log(err.message);
		callback({success: false, failMsg: "Something went wrong, please try again."}, res);
	}
}

//Configure nunjucks to be default renderer
nunjucks.configure('Client', {
	autoescape: true,
	express: app,
	watch: true
});

//Make Client folder accessable 
app.use(express.static("Client"));

//Parse POST requests
app.use(express.bodyParser());

//Cookie parsing
app.use(express.cookieParser());

//Homepage
app.get("/", function (req, res) {
	mongo.connect(url, function (err, db) {
		if (err != undefined) {
			console.log(err.message);
		}
		db.collection("polls").find().toArray(function (err, data) {
			if (err != undefined) {
				console.log(err.message);
			}
			
			var polls = [];
			
			for (var poll in data) {
				polls.push(data[poll]["_id"]);
			}
			res.render("Home/Home.njk", {
				polls: polls
			});
		});
	});
});

//New user creation page
app.get("/new/user", function (req, res) {
	if (req.cookies.token != undefined) {
		res.redirect("/");
	}
	res.sendfile("Client/New/User/User.html");
});

//New poll creation page
app.get("/new/poll", function (req, res) {
	if (req.cookies != undefined) {
		try {
			check(jwt.verify(req.cookies.token, process.env.SECRET), res, function(verified, res) {
				if (verified.success) {
					res.sendfile("Client/New/Poll/Poll.html");
				} else {
					res.sendfile("Client/NotUser/NotUser.html");
				}
			});
		} catch (err) {
			res.sendfile("Client/NotUser/NotUser.html");
		}
	} else {
		res.sendfile("Client/NotUser/NotUser.html");
	}
});

//Dealing with new user creation
app.post("/new/user", function (req, res) {
	try {
		var salt = crypto.randomBytes(128).toString('base64'),
			iterations = 100,
			hash = crypto.pbkdf2Sync(req.body.password, salt, iterations, 512).toString('hex'),
			toMongo = {
				_id: req.body.username,
				salt: salt,
				hash: hash,
				iterations: iterations
			};
		mongo.connect(url, function (err, db) {
			if (err != undefined) {
				console.log(err.message);
			}
			db.collection("users").findOne({ _id: toMongo["_id"] }, function (err, userExist) {
				if (err != undefined) {
					console.log(err.message);
				}
				if (userExist === null) {
					db.collection("users").insertOne(toMongo, function (err, other) {
						if (err != undefined) {
							console.log(err.message);
							res.send({ success: false, failMsg: "Sorry, something went wrong. Please try again." });
						} else {
							res.cookie("token", jwt.sign( { _id: req.body.username, hash: toMongo.hash }, process.env.SECRET, { expiresIn: "1d" }), { maxAge: 86400000, path: "/" });
							res.cookie("user", req.body.username, { maxAge: 86400000 });
							res.send({ success: true });
						}
					});
				} else {
					res.send({ success: false, failMsg: "Sorry, that username already exists." });
				}
				res.end();
			});
		});
	} catch (err) {
		console.log(err.message);
		res.send({ success: false, failMsg: "Something went wrong, please try again." });
		res.end();
	}
});

//Add new poll
app.post("/new/poll", function (req, res) {
	if (req.cookies != undefined) {
		check(jwt.verify(req.cookies.token, process.env.SECRET), res, function(verified, res) {
			if (verified.success) {
				try {
					mongo.connect(url, function(err, db) {
						if (err != undefined) {
							console.log(err.message);
						}
						db.collection("polls").findOne({ _id: req.body.name }, function (err, pollExist) {
							if (err != undefined) {
								console.log(err.message);
							}
							if (pollExist === null) {
								var options = {};
								
								for (var i = 0; i < req.body.options.length; i++) {
									options[req.body.options[i]] = 0;
								}
								
								console.log(options);
								
								db.collection("polls").insertOne({ _id: req.body.name, user: req.cookies.user, options: options}, function (err, other) {
									if (err != undefined) {
										console.log(err.message);
										res.send({ success: false, failMsg: "Sorry, something went wrong when we were making your poll." });
									} else {
										res.send({ success: true });
									}
									res.end();
								});
							} else {
								res.send({ success: false, failMsg: "Sorry, that poll already exists. Please try a different name." });
								res.end();
							}
						});
					});
				} catch (err) {
					console.log(err.message);
					res.send({ success: false, failMsg: "Something went wrong, please try again."});
					res.end();
				}
			} else {
				res.send({success: false, failMsg: "Please log in."});
				res.end();
			}
		});
	} else {
		res.send({success: false, failMsg: "Please log in."});
		res.end();
	}
});

app.post("/new/option", function(req, res) {
	if (req.cookies != undefined) {
		check(jwt.verify(req.cookies.token, process.env.SECRET), res, function(verified, res) {
			if (verified.success) {
				mongo.connect(url, function(err, db) {
					if (err != undefined) {
						console.log(err.message);
					}
			
					function addOpt (options) {
						db.collection("polls").update({_id: req.body.poll}, {$set: {options}}, function (err, status) {
							if (err != undefined) {
								console.log(err.message);
								res.send({success: false, failMsg: "Apologies, something went wrong when we were adding your option."});
								res.end();
							} else {
								res.send({success: true});
								res.end();
							}
						});
					}
			
					db.collection("polls").find({_id: req.body.poll}).toArray(function (err, data) {
						if (err != undefined) {
							console.log(err.message);
							res.send({success: false, failMsg: "Apologies, something went wrong when we were retriving the poll."});
							res.end();
						} else {
							if (data[0].options[req.body.name] == undefined) {
								data[0].options[req.body.name] = 1;
								addOpt(data[0].options);
							} else {
								res.send({success: false, failMsg: "Sorry, that option already exists."});
								res.end();
							}
						}
					});
				});
			} else {
				res.send({success: false, failMsg: "Please log in."});
				res.end();
			}
		});
	} else {
		res.send({success: false, failMsg: "Please log in."});
		res.end();
	}
});

//Sign in page for users
app.get("/signin", function (req, res) {
	if (req.cookies.token != undefined) {
		res.redirect("/");
		return;
	}
	res.sendfile("Client/Signin/Signin.html");
});

//Handle user sign in.
app.post("/signin", function (req, res) {
	var user = {
		_id: req.param("username"),
		hash: req.param("password")
	};
	try {
		mongo.connect(url, function(err, db) {
			if (err != undefined) {
				console.log(err.message);
			} else {
				db.collection("users").findOne({ _id: user["_id"] }, function (err, userReal) {
					if (err != undefined) {
						console.log(err.message);
					}
					if (userReal != null) {
						user.hash = crypto.pbkdf2Sync(user.hash, userReal.salt, userReal.iterations, 512).toString('hex');
						
						if (user.hash === userReal.hash) {
							res.cookie("token", jwt.sign( { _id: user["_id"], hash: user.hash }, process.env.SECRET, { expiresIn: "1d" }), { maxAge: 86400000, path: "/" });
							res.cookie("user", user["_id"], { maxAge: 86400000 });
							res.send({ success: true });
						} else {
							res.send({ success: false, failMsg: "Incorrect username or password."});
						}
						res.end();
					} else {
						res.send({ success: false, failMsg: "Incorrect username or password."});
						res.end();
					}
				});
			}
		});
	} catch (err) {
		console.log(err.message);
		res.send({ success: false, failMsg: "Something went wrong, please try again."});
		res.end();
	}
});

app.post("/voted", function(req, res) {
	var vote = {};
	vote["options." + req.body.vote] = 1;
	mongo.connect(url, function(err, db) {
		if (err != undefined) {
			console.log(err.message);
			res.send({success: false, failMsg: "Apologies, the database is currently unreachable."});
			res.end();
		} else {
			db.collection("polls").update({_id: req.body.name}, {$inc: vote}, function (err, other) {
				if (err != undefined) {
					console.log(err.message);
					res.send({success: false, failMsg: "Apologies, something went wrong when we were recording your vote."});
					res.end();
				} else {
					res.send({success: true});
					res.end();
				}
			});
		}
	});
});

//Delete a poll
app.post("/delete", function(req, res) {
	if (jwt.verify(req.cookies.token, process.env.SECRET)["_id"] == req.cookies.user) {
		check(jwt.verify(req.cookies.token, process.env.SECRET), res, function(verified, res) {
			if(verified.success) {
				mongo.connect(url, function(err, db) {
					if (err != undefined) {
						console.log(err.message);
						res.send({success: false, failMsg: "Failed to connect to the database"});
						res.end();
					}
					db.collection("polls").find({_id: req.body.name}).toArray(function (err, data) {
						console.log(req.cookies.user + " " + data[0]["user"]);
						if (err != undefined) {
							console.log(err.message);
							res.send({success: false, failMsg: "Failed to connect to the database"});
							res.end();
						}
						if (req.cookies.user == data[0]["user"]) {
							db.collection("polls").remove({_id: req.body.name}, function (err, other) {
								if (err != undefined) {
									console.log(err.message);
									res.send({success: false, failMsg: "Failed to connect to the database"});
								} else {
									res.send(verified);
								}
								res.end();
							});
						} else {
							res.send({success: false, failMsg: "You don't have permission to delete this file."});
							res.end();
						}
					});
				});
			} else {
				res.send(verified);
				res.end();
			}
		});
	} else {
		res.send({success: false, failMsg: "You don't have permission to delete this file."});
		res.end();
	}
});

//Polls, uses Nunjucks templating engine.
app.get("/*", function (req, res) {
	try {
		mongo.connect(url, function(err, db) {
			if (err != undefined) {
				console.log(err.message);
			}
			db.collection("polls").findOne({ _id: decodeURI(req.params[0]) }, function (err, poll) {
				if (err != undefined) {
					console.log(err.message);
				}
				if (poll == null) {
					res.sendfile("Polls/Failed.html");
				} else {
					var options = {};
					
					for (var option in poll.options) {
						options[option.replace(new RegExp("_______PEROID_______", "g"), ".")] = poll.options[option];
					}
					
					res.render("Polls/Polls.njk", { options: options, name: poll["_id"], found: true, user: poll.user});
				}
			});
		});
	} catch (err) {
		console.log(err.message);
		res.sendfile("Polls/Failed.html");
		res.end();
	}
});

app.listen(process.env.PORT);