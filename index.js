var express = require('express');

var app = express();

var arm = require('./routes/arm');

var fb = require('./routes/fb');

var bodyParser = require('body-parser');

var login = require('facebook-chat-api');

var cfenv = require('cfenv');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var mongoose = require('mongoose');

var Promise = require('bluebird');

var userModel = require('./models/user');

var extensions = require('./extensions/extras');

mongoose.connect("mongodb://localhost:27017/dexter");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
        extended: false
}));
// parse application/json
app.use(bodyParser.json())

app.post("/nlp", arm.processBody);

login({
        email: "dexterhi@outlook.com",
        password: "password"
}, function callback(err, api) {
        if (err) return console.error(err);
        api.listen(function callback(err, message) {
        		if (message.body.toLowerCase().includes("dexter")){
        			arm.armMessenger(api, message);
        		} else if (message.body.toLowerCase().includes("weather")) {
                        fb.sendWeather(message, api);
                } else if (message.body.toLowerCase().includes("expedia")) {
                        expediaCheckLevel(message, api);
                } else {
                	checkIfConvo(message, api); // Check if they might be in the middle of a convo.
                }
        });
});

function checkIfConvo(message, api){
	Promise.try(function (){
		return userModel.findById(message.senderID);
	}).then(function (oneModel) {
		if(oneModel){
		  if(oneModel.deepness > 0){
			if(oneModel.type === "expedia"){
				expediaCheckLevel(message, api);
			} else if(oneModel.type === "apple"){
				// ....
			}
		  }
		}
	});
}

function expediaCheckLevel(message, api) {
        Promise.try(function() {
                return userModel.findById(message.senderID);
        }).then(function(oneModel) {
                if (oneModel) { // User found
                	if(oneModel.type !== "expedia"){ // type mismatch
                		return extensions.resetDeepnessToZero(message.senderID, "expedia");
                	} else if(oneModel.type === "expedia"){ // type match
	                	return oneModel;
                	} else { // WTF?
                		return null;
                	}
                } else { // User not found
                	console.log("user was not found, registering.....");
                		return extensions.registerUser(message, "expedia"); // register user
                }
        }).then(function(oneModel) {
        	console.log('level: ' + oneModel.deepness);
                switch (oneModel.deepness) {
                        case 0: // Initial
                        		console.log('hit case #1');
                                fb.expediaDeepnessZero(message, api);
                                break;
                        case 1: // Selected Flight/Local event
                                fb.expediaDeepnessOne(message, api);
                                break;
                        case 2: // Selected amount of passengers
                        		fb.expediaDeepnessTwo(message, api);
                        		break;
                        case 3: // Selected locations
                        		fb.expediaDeepnessFlight(message, api);
                        		break;
                        case 4:
                        		fb.expediaDeepnessLocal(message, api);
                        		break;
                }
        });
}

app.listen(appEnv.port);