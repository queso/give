//creating a global server logger
logger = Meteor.require('winston');

var Papertrail = Meteor.require('winston-papertrail').Papertrail;
logger.add(Papertrail, {
  host: "logs.papertrailapp.com",
  port: 17342, //this will be change from the papertrail account to account
  logFormat: function(level, message) {
      return '[' + level + '] ' + message;
  },
  inlineMeta: true
});
logger.info(" =====> Meteor App restarted "+ new Date( Date.now()) +" <=====");