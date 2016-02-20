var Promise = require('bluebird');

var extensions = require('../extensions/extras')
var commands = [{
	object: null,
	color: null,
	direction: null
}];
exports.checkMessage = function(api, message) {
        Promise.try(function() {
                return extensions.wit(message.body);
        }).then(function (witResponse){
		var entities = witResponse.outcomes[0].entities;
			if(Object.keys(entities).length > 0){ // At least one object found.
				return entities;
			} else {
				return null;
			}
        }).then(function(entities) {
        	console.log(JSON.stringify(entities));
                if (entities) {
                        if (entities.object) {
                                commands[0].object = entities.object[0].value
                                if (entities.color && entities.direction) {
                                        commands[0].color = entities.color[0].value
                                        commands[0].direction = entities.direction[0].value
                                        return "Okay, " + message.senderName.substring(0, message.senderName.indexOf(" ")) + " I'm moving the " + entities.color[0].value + " " + entities.object[0].value + " to the " + entities.direction[0].value + " side.";
                                } else if (entities.color) {
                                        commands[0].color = entities.color[0].value
                                        return "Okay, I'm picking up the " + entities.color[0].value + " " + entities.object[0].value;
                                } else if (entities.direction) {
                                        commands[0].direction = entities.direction[0].value
                                        return "Moving the " + entities.object[0].value + " to the " + entities.direction[0].value + "direction.";
                                } else { // dir and color are both not found
                                	return "Got it " + message.senderName.substring(0, message.senderName.indexOf(" ")) + ", I'm going to try picking up the " + entities.object[0].value + " now!"
                                }
                        } else if (entities.direction) {
                                return "I picked up that you want to move something to the " + entities.direction[0].value + " side, but I couldn't quite get the object."
                        } else if (entities.color) {
                                return "I noticed that you want me to pick something up, but I was only able to get a color from your input."
                        } else {
                                return "I didn't pick up anything from your response."
                        }
                } else {
                        return "Sorry, I didn't understand your request"
                }
        }).then(function (finalResponse){
        	api.sendMessage(finalResponse, message.threadID);
        }).catch(function (e){
        	console.error(e);
        	api.sendMessage("Something went wrong!", message.threadID);
        });
}