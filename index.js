var express = require('express');

var app = express();

var nlp = require('./routes/nlp');

var fb = require('./routes/fb');

var bodyParser = require('body-parser');

var login = require('facebook-chat-api');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json())

app.post("/nlp", nlp.processBody);

login({email: "dexterhi@outlook.com", password: "kevin231436"}, function callback (err, api) {
    if(err) return console.error(err);
    api.listen(function callback(err, message) {
        fb.checkMessage(api, message);
    });
});

app.listen(3000);