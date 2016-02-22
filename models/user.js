var mongoose = require('mongoose');

// Create the Schema
var contactSchema = new mongoose.Schema({
		_id: Number, // GroupID
		type: String,
		name: String,
		deepness: Number,
		expedia: [{
			pref: String,
			participants: Number,
			budget: Number,
			possibleTrips: [String],
		}]
});

// create the model
module.exports = mongoose.model('users', contactSchema);