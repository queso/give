Meteor.startup(function() {
    return Meteor.Mandrill.config({
        username: Meteor.settings.mandrillUsername,
        "key": Meteor.settings.mandrillKey
    });

    Stripe.setPublishableKey(Meteor.settings.public.stripe.publishable);

    var handler = StripeCheckout.configure({
        key: Meteor.settings.public.stripe.publishable,
        token: function(token) {}
    });
});
