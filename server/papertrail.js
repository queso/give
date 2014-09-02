//creating a global server logger
logger = Meteor.npmRequire('winston');

var Papertrail = Meteor.npmRequire('winston-papertrail').Papertrail;
logger.add(Papertrail, {
	levels: {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
			auth: 4
		},
		colors: {
			debug: 'blue',
			info: 'green',
			warn: 'red',
			error: 'red',
			auth: 'red'
		},
		host: "logs.papertrailapp.com",
		port: 17342, //this will be change from the papertrail account to account
		logFormat: function(level, message) {
		return '[' + level + '] ' + message;
  },
  inlineMeta: true
});
logger.info(" =====> Meteor App restarted "+ new Date( Date.now()) +" <=====");