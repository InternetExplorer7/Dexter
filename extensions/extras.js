var wit = require('node-wit');

var watson = require('watson-developer-cloud');

var fs = require('fs');

var uuid = require('node-uuid');

/*
Pass in user input (text) -- returns Wit response.
*/
exports.wit = function(body) {
        return new Promise(function(resolve, reject) {
                return wit.captureTextIntent("SMW7UUVOXV47S4AKV5CXWSIRJKT6JQCF", body, function(err, res) {
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
                username: '53a168a3-2134-4afa-9a8e-5932fb2a512c',
                password: 'xwW1sud7K2my',
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