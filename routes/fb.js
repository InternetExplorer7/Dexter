var Promise = require('bluebird');

 var extensions = require('../extensions/extras')

 var bhttp = require('bhttp');

 var saveToExpedia = require('../extensions/expediaSave');

 var userModel = require('../models/user');
/*
resets deepness lvl back to 0.
*/
exports.expediaDeepnessZero = function (message, api){
	api.sendMessage("Are you looking for something local, or fly out-of-town?", message.threadID);
	extensions.updateDeepness(message, 0); // Update deepness to 1
}
/*
Second step, user selects either option plane or local.
*/
exports.expediaDeepnessOne = function (message, api){
	var pref;
	Promise.try(function () {
		return message.body.toLowerCase();
	}).then(function (body){
		console.log('body ' + body);
		if(body.includes("fly") || body.includes("plane") || body.includes("flight") || body.includes("second")){
			return "flight"
		} else if(body.includes("local") || body.includes("events")){
			return "local"	
		}
	}).then(function (pref){
		console.log('pref: ' + pref);
		this.pref = pref;
		return userModel.findById(message.senderID);
	}).then(function (oneModel){
		oneModel.expedia[0].pref = this.pref;
		return oneModel.save();
	}).then(function (saved){
		if(this.pref === 'flight'){
			api.sendMessage("Got it, before I start searching for flights, how many people will this trip include?", message.threadID);
		} else if(this.pref === 'local'){
			api.sendMessage("Okay, before I start searching for local events, how many people will be on this trip?", message.threadID);
		}
		extensions.updateDeepness(message, 1);
	});
}

/*
Third step, user specifies how many people will be attending.
*/
exports.expediaDeepnessTwo = function (message, api){
	var passengers;
	Promise.try(function () {
		return extensions.wit(message.body);
	}).then(function (witResponse){
		var entities = witResponse.outcomes[0].entities;
		if(extensions.validate(entities)){ // Number is there
			return entities.number[0].value
		} else {
			return 0;
		}
	}).then(function (passengers){ 
		this.passengers = passengers;
		return userModel.findById(message.senderID);
	}).then(function (oneModel){
		oneModel.expedia[0].participants = this.passengers;
		return oneModel.save();
	}).then(function(saved){
		if(saved.expedia[0].pref === 'flight'){
			extensions.updateDeepness(message, 2);
			api.sendMessage("Okay, flight packages for " + this.passengers + " people. I noticed that " + message.senderName.substring(0, message.senderName.indexOf(" ")) +" took a trip to San Francisco 2 months ago and left a good review. Would you all like to book a similar package?", message.threadID);
		} else if(saved.expedia[0].pref === 'local'){
			extensions.updateDeepness(message, 3);
			api.sendMessage("Okay, I've found quite a few events for " + this.passengers + " people. Would you be interested in viewing the Space Needle?", message.threadID);
		}
	});
}
/*
Fourth step, get destination
*/
exports.expediaDeepnessFlight = function (message, api){
	Promise.try(function (){
		return message.body
	}).then(function (body){
		if(body.toLowerCase().includes('yes') || body.toLowerCase().includes('y')){
			return true;
		} else {
			return false;
		}
	}).then(function(accepted){
		if(accepted){
			api.sendMessage("Done, " + message.senderName.substring(0, message.senderName.indexOf(" ")) + ". I'm sending a ticket to your personal inbox now.", message.threadID);
			api.sendMessage("I'm processing your request now and will send ticket details when completed.", message.senderID);
		} else {
			api.sendMessage("Still waiting on " + message.senderName.substring(0, message.senderName.indexOf(" ")) + " to complete this purchase.", message.threadID);
		}
		extensions.resetDeepnessToZero(message);
	});
}


exports.expediaDeepnessLocal = function (message, api){
	Promise.try(function () {
		return message.body;
	}).then(function(body) {
		if(body.toLowerCase().includes('yes') || body.toLowerCase().includes('y')){
			return true;
		} else {
			return false;
		}
	}).then(function(accepted){
		if(accepted){
			api.sendMessage("Okay, I've booked your local event.", message.threadID);
			api.sendMessage("Hang on as I process your request.", message.senderID);
		} else {
			api.sendMessage("Still waiting on someone to confirm their booking.", message.threadID);
		}
		extensions.resetDeepnessToZero(message);
	})
}
/*
Returns weather as a string
*/
exports.sendWeather = function (message, api) {
	Promise.try(function (){
		return extensions.wit(message.body);
	}).then(function (witResponse) {
		var entities = witResponse.outcomes[0].entities;
		if(witResponse.outcomes[0].intent === 'weather' && extensions.validate(entities)){
			return entities;
		} else {
			return null;
		}
	}).then(function (entities) { // if not null, location was passed.
		return entities.location[0].value;
	}).then(function (location){
		if(location){
			return bhttp.get("http://api.openweathermap.org/data/2.5/weather?q=" + location + "&appid=44db6a862fba0b067b1930da0d769e98");
		} else {
			return null;
		}
	}).then(function (weatherResponse){
		console.log(JSON.stringify(weatherResponse.body));
		if(weatherResponse.body){
			api.sendMessage(message.senderName.substring(0, message.senderName.indexOf(" ")) + ". " + weatherResponse.body.name + " is currently experiencing " + weatherResponse.body.weather[0].description, message.threadID);
		} else {
			api.sendMessage("Sorry, something went wrong and I couldn't find the weather for your location. Please try again later.", message.threadID);
		}
	}).catch(function (err){
		console.error(err);
	});
}