var express = require('express');
//for mongodb
var mongojs = require('mongojs');
//for encription
var bcrypt = require ('bcrypt-nodejs');
var router = express.Router();
//mlab uri
var uri = 'mongodb://successpredictor:cmpe295@ds155130.mlab.com:55130/boxoffice';
//connect to mlab 
var db = mongojs( uri, ['registration'], ['userVote']);
//imdb api
var imdb = require('imdb-api');
var movieName = "";


/* GET register page. */
router.get('/', function(req, res, next) {
	res.render('register', { title: 'Box Office Success Predictor Registration' });
});

//GET login page
router.get('/login', function(req, res, next) {
	res.render('login', { title: 'Box Office Success Predictor Login' });
});

//GET user dashboard page
router.get('/userDashBoard', function(req, res, next) {
	res.render('userDashboard', { title: 'Box Office Success Predictor User Dashboard' });
});

//GET user dashboard page
router.get('/analytics', function(req, res, next) {
	res.render('analytics', { title: 'Box Office Success Predictor Analytics' });
});

//destroy session and logout
router.get('/logout', function(req, res){
	//destroy the current session and logout
	req.session.destroy(function(err) {
	  	if(err) {
	    	console.log(err);
	  	} else {
	    	res.render('login', { title: 'Box Office Success Predictor Login' });
	    }
	});
});

//first time registration
router.post('/savemovie', function(req, res) {
	db.registration.find({"email": req.body.email}, function(err, users) {
	  	if(err) {
	  		console.log("error " + err);
	  		res.send({"regstatus":"error", "errors":err});
	  	}
	  	else if(!users){
	  		//salt and hash encryption
			bcrypt.genSalt(10, function(err, salt) {
				if(err){
					console.log("error " + err);
					res.send({"regstatus":"error", "errors":err});
				}
				else{
					bcrypt.hash(req.body.password, salt, function(err, hash) {
						if(err){
							console.log("error " + err);
							res.send({"regstatus":"error", "errors":err});
						}
						else{
							//hashed password
							req.body.password = hash;
							//session details
							req.session.email = req.body.email; 
							//inserting registration movie details into mlabs registration collection
							db.registration.insert(req.body , function (err, doc) {
								if(err){
									console.log("error " + err);
									res.send({"regstatus":"error", "errors":err});
								}
								else{
									res.json({"documents" : doc, "email" : req.session.email});
								}
							});
						}
					});
				}
			});
	  	}
	  	else {
	  		console.log("userExists");
	  		res.send({"regstatus":"userExists"});
	  	}
	});
});

//adding movie to the movie makers dashboard
router.post('/addmovie', function(req, res) {
	req.body.email = req.session.email;
	db.registration.insert(req.body , function (err, doc) {
		if(err){
			console.log("error " + err);
			res.send({"regstatus":"error", "errors":err});
		}
		else{
			res.json({"documents" : doc, "email" : req.session.email});
		}
	});
});

//login validation
router.post('/afterLogin', function(req, res) {
	db.registration.find({"email": req.body.email}, function(err, users) {
		console.log(JSON.stringify(users) + " users");
	  	if(err) {
	  		console.log("Error");
	  		res.send({"loginstatus":"error", "errors":err});
	  	}
	  	else if(!users.length){
	  		console.log("No email id");
	  		res.send({"loginstatus":"incorrectemail"});
	  	}
	  	else {
	  		 bcrypt.compare(req.body.password, users[0].password, function(err, response) {
		    	console.log("Password match " +response);
		    	if(response){
		    		req.session.email = req.body.email;
		    		res.send({"loginstatus":"success"});
		    	}
		    	else{
					res.send({"loginstatus":"incorrectPassword"});
		    	}
		    });
	  	}

	 });
});

//render movie maker dashboard
router.get('/getMovieMakerDashboard', function(req, res){
	console.log("rendering movie maker dashboard");
	console.log(req.session.email)
	if(req.session.email)
	{
		//Set these headers to notify the browser not to maintain any cache for the page being loaded
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('movieMakerDashboard', { title: 'Box Office Success Predictor Movie Maker Dashboard' });
	}
	else
	{
		res.render('login', { title: 'Box Office Success Predictor Login' });
	}
});
//get sentiment analysis results
router.get('/getSentimentAnalysis', function(req, res) {
	db.movieDashBoard.find({"movieName":  movieName},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});


//get data for movie maker dashboard
router.get('/getmovieDataForMaker',function(req, res){
	console.log(req.session.email);
	db.registration.find({"email": req.session.email}, function(err, docs) {
		if(err) {
	  		console.log("Error");
	  		res.send({"statusOfMovieMaker":"error", "errors":err});
	  		//res.render('register', { title: 'Box Office Success Predictor Registration' });
	  	}
	  	else if(!docs.length){
	  		console.log("No data found");
	  		res.send({"statusOfMovieMaker":"nodata"});
	  	}
	  	else{
	  		res.json({"documents" : docs, "email" : req.session.email});
	  	}
	});
});

//get data for user dashboard
router.get('/getmovieDataForUser',function(req, res){
	db.upcomingMovies.find({}, function(err, docs) {
		console.log(docs);
		if(err) {
	  		console.log("Error");
	  		res.send({"returnstatus":"error", "errors":err});
	  	}
	  	else if(!docs.length){
	  		console.log("No data found");
	  		res.send({"returnstatus":"nodata"});
	  	}
	  	else{
	  		res.send(docs);
	  	}
	});
});

//get genre ids
router.get('/getGenre',function(req, res){
	db.GenreId.find({}, function(err, docs) {
		console.log(docs);
		if(err) {
	  		console.log("Error");
	  		res.send({"returnstatus":"error", "errors":err});
	  	}
	  	else if(!docs.length){
	  		console.log("No data found");
	  		res.send({"returnstatus":"nodata"});
	  	}
	  	else{
	  		res.send(docs);
	  	}
	});
});

//delete movie
router.get('/deleteMovieById/:id', function(req, res) {
	var id = mongojs.ObjectId(req.params.id);
	db.registration.remove({_id: mongojs.ObjectId(id)},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json(doc);
		}
	});	
});

//edit movie
router.get('/editMovieById/:id', function(req, res) {
	var id = mongojs.ObjectId(req.params.id);
	db.registration.findOne({_id: mongojs.ObjectId(id)},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});

//update movie
router.post('/updateMovie/:id', function(req, res) {
	var id = req.params.id;
	db.registration.findAndModify({query: {_id: mongojs.ObjectId(id)},
		update:{$set : {movie : req.body.movie, year : req.body.year, month : req.body.month, summary : req.body.summary, 
			genre : req.body.genre, actor1 : req.body.actor1, actor2 : req.body.actor2, actor3 : req.body.actor3, director : req.body.director,
			producer : req.body.producer, budget : req.body.budget, language : req.body.language, poster : req.body.poster, trailer : req.body.trailer}},
		new : true},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});
});

router.get('/findMovieByName/:name', function(req, res) {
	db.upcomingMovies.find({original_title: {'$regex' : req.params.name, '$options' : 'i'}},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});

/*router.get('/findMovie', function(req, res) {
	db.upcomingMovies.find({},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});*/

router.get('/findMovieByNameMovieMaker/:name', function(req, res) {
	db.registration.find({movie: {'$regex' : req.params.name, '$options' : 'i'}},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});

router.get('/getFbReaction', function(req, res) {
	db.fbreactions.find({"movieName":  movieName},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});

router.get('/getYoutubeData', function(req, res) {
	db.youtubeStats.find({"name":  movieName},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});

router.get('/getAnalyticsByName/:name', function(req, res) {
	movieName = req.params.name;
	res.json({"resp" : "success"});
});

router.get('/updateYes/:name', function(req, res) {
	var movieTitle = req.params.name;
	var counterYes = 1;
	var counterNo = 0;
	db.userVote.find({"movie":  movieTitle}, function(err,doc){
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}else{
			if(doc.length === 0){
				db.userVote.insert({"movie" : movieTitle, "Yes" : counterYes, "No" : counterNo}, function(err,doc){
					if(err){
						res.send({"returnstatus":"error", "errors":err});
					}else{
						res.json({"doc" : doc});
					}
				})
			}else{
				db.userVote.findAndModify({
				    query: { movie: movieTitle },
				    update: { $inc: { Yes: 1 } },
				    new : true
				}, function(err,doc){
					if(err){
						res.send({"returnstatus":"error", "errors":err});
					}else{
						res.json({"doc" : doc});
					}
				})
			}
		}
	})
});

router.get('/updateNo/:name', function(req, res) {
	var movieTitle = req.params.name;
	var counterYes = 0;
	var counterNo = 1;
	db.userVote.find({"movie":  movieTitle}, function(err,doc){
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}else{
			if(doc.length === 0){
				db.userVote.insert({"movie" : movieTitle, "Yes" : counterYes, "No" : counterNo}, function(err,doc){
					if(err){
						res.send({"returnstatus":"error", "errors":err});
					}else{
						res.json({"doc" : doc});
					}
				})
			}else{
				db.userVote.findAndModify({
				    query: { movie: movieTitle },
				    update: { $inc: { No: 1 } },
				    new : true
				}, function(err,doc){
					if(err){
						res.send({"returnstatus":"error", "errors":err});
					}else{
						res.json({"doc" : doc});
					}
				})
			}
		}
	})
});

router.get('/getUserVote', function(req, res) {
	db.userVote.find({"movie":  movieName},function (err,doc) {
		if(err){
			res.send({"returnstatus":"error", "errors":err});
		}
		else{
			res.json({"doc" : doc});
		}
	});	
});

//get IMDB data
/*router.post('/getImdbData', function(err,docs){
	console.log("inside", req.param.title);
	imdb.getReq({ name: req.param.title }, function(err,movie){
		if(err) {
	  		console.log("Error");
	  		res.send({"returnstatus":"error", "errors":err});
	  	}
	  	else if(!docs.length){
	  		console.log("No data found");
	  		res.send({"returnstatus":"nodata"});
	  	}
	  	else{
	  		res.send(movie);
	  	}
	});
});*/

module.exports = router;
