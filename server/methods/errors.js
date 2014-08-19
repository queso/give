Meteor.methods({
	logError: function (error, messageGiven) {
		logger.error("Error category_code for message given to the client: " + error.category_code);
		logger.error("Error message shown to the client: " + messageGiven);
	}
});