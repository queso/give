Meteor.startup(function() {
  return Meteor.Mandrill.config({
    username: Meteor.settings.mandrillUsername,
    "key": Meteor.settings.mandrillKey
  });
});
