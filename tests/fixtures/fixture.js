Meteor.startup(function() {
    if (Meteor.isClient || !process.env.IS_MIRROR) {
        return;
    }
    Meteor.users.remove({});
    Accounts.createUser({
        username: "joshbechard",
        email: "josh@test.com",
        password: "great password :-)",
        profile: {
            name: "Joshua Bechard"
        }
    });
});