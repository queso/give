Meteor.startup(function() {
  Kadira.connect(Meteor.settings.kadiraUser, Meteor.settings.kadiraKey);
});