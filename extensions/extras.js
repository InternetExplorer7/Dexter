var wit = require('node-wit');

var watson = require('watson-developer-cloud');

var Promise = require('bluebird');

var fs = require('fs');

var uuid = require('node-uuid');

var userModel = require('../models/user');


exports.registerUser = function(message, newType) {
        return new Promise(function(resolve, reject) {
                Promise.try(function() {
                        return new userModel({
                                _id: message.senderID,
                                type: newType,
                                name: message.senderName,
                                deepness: 0,
                                expedia: [{
                                        pref: "",
                                        participants: 0,
                                        budget: 0,
                                        possibleTrips: [],
                                        finalTrips: []
                                }]
                        });
                }).then(function(oneModel) {
                        console.log(JSON.stringify(oneModel));
                        return oneModel.save();
                }).then(function(finalModel) {
                        resolve(finalModel);
                });
        });
}


/*
Account already exists, but is already deep in another branch. Reset deepness and set type to new branch.
*/
exports.resetDeepnessToZero = function(message) {
                Promise.try(function() {
                        return userModel.findByIdAndUpdate(message.senderID, {
                                deepness: 0
                        });
                }).then(function(oneModel) {
                        return oneModel.save();
                });
        }
        /*
        Pass in user input (text) -- returns Wit response.
        */
exports.wit = function(body) {
                return new Promise(function(resolve, reject) {
                        return wit.captureTextIntent("KEY", body, function(err, res) {
                                if (err) reject(err);
                                else resolve(res);
                        });
                });
        }
        /*
        Pass in entities from Wit (object) -- returns audio location
        */
exports.watson = function(body) {
        var fileName = uuid.v4() + '.wav';
        var text_to_speech = watson.text_to_speech({
                username: 'uname',
                password: 'pass',
                version: 'v1'
        });

        var params = {
                text: body,
                voice: 'en-US_AllisonVoice', // Optional voice 
                accept: 'audio/wav'
        };

        // Pipe the synthesized text to a file 
        var audio = fs.createWriteStream('./audio/' + fileName);
        text_to_speech.synthesize(params).pipe(audio);
        return 'audio/' + fileName; // Lets assume that it saved sucesfully.
}

exports.validate = function(entities) {
                if (Object.keys(entities).length > 0) { // At least one object found.
                        return true;
                } else {
                        return false;
                }
        }
        /*
        Updates deepness by 1.
        */
exports.updateDeepness = function(message, curDeepness) {
        Promise.try(function() {
                return userModel.findByIdAndUpdate(message.senderID, {
                        deepness: curDeepness + 1
                }, {
                        new: true
                });
        }).then(function(oneModel) {
                console.log('sucesfully saved: ' + JSON.stringify(oneModel));
        });
}