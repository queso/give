Template.UserProfile.helpers({
    user: function () {
        return Meteor.users.findOne();
    },
    name: function () {
        return this.profile.name;
    },
    email: function () {
        return Meteor.users.findOne().emails;
    }

});
