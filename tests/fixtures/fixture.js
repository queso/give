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

HttpInterceptor = Package['xolvio:http-interceptor'].HttpInterceptor;

HttpInterceptor.registerInterceptor('https://api.stripe.com', Meteor.absoluteUrl('fake.stripe.com'));
