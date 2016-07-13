// Required Modules
var express    = require("express");
var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require("jsonwebtoken");
var mongoose   = require("mongoose");
var app        = express();

var port = process.env.PORT || 3001;
var database = require('./config/database');            // load the database config
var User     = require('./models/User');

// configuration ===============================================================
mongoose.connect(database.url);     // connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({ extended: true }));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

app.post('/authenticate', function(req, res) {
	User.findOne({email: req.body.email, password: req.body.password}, function(err, user) {
		if (err) {
			res.json({
				type: false,
				data: "Error occured: " + err
			});
		} else {
			if (user) {
				res.json({
					type: true,
					data: user,
					token: user.token
				});
			} else {
				res.json({
					type: false,
					data: "Incorrect email/password"
				});
			}
		}
	});
});


app.post('/signin', function(req, res) {
	User.findOne({email: req.body.email, password: req.body.password}, function(err, user) {
		if (err) {
			res.json({
				type: false,
				data: "Error occured: " + err
			});
		} else {
			if (user) {
				res.json({
					type: false,
					data: "User already exists!"
				});
			} else {
				var userModel = new User();
				userModel.email = req.body.email;
				userModel.password = req.body.password;
				userModel.save(function(err, user) {
					user.token = jwt.sign(user, process.env.JWT_SECRET);
					user.save(function(err, user1) {
						res.json({
							type: true,
							data: user1,
							token: user1.token
						});
					});
				})
			}
		}
	});
});

app.get('/me', ensureAuthorized, function(req, res) {
	User.findOne({token: req.token}, function(err, user) {
		if (err) {
			res.json({
				type: false,
				data: "Error occured: " + err
			});
		} else {
			res.json({
				type: true,
				data: user
			});
		}
	});
});

function ensureAuthorized(req, res, next) {
	var bearerToken;
	var bearerHeader = req.headers["authorization"];
	if (typeof bearerHeader !== 'undefined') {
		var bearer = bearerHeader.split(" ");
		bearerToken = bearer[1];
		req.token = bearerToken;
		next();
	} else {
		res.send(403);
	}
}

process.on('uncaughtException', function(err) {
	console.log(err);
});

// Start Server
app.listen(port, function () {
	console.log( "Express server listening on port " + port);
});