(function () {

    'use strict';

    var assert = require('assert');

    module.exports = function () {

        var helper = this;

        this.Given(/^I am signed out$/, function (callback) {
            helper.world.browser.
                url(helper.world.cucumber.mirror.rootUrl + "sign-out").
                waitForExist('.account-link', 1000).
                waitForVisible('.account-link', 1000).
                call(callback);
        });

        this.Given(/^I am on the home page$/, function (callback) {
            helper.world.browser.
                url(helper.world.cucumber.mirror.rootUrl + 'give?donateWith=Card&exp_month=12&exp_year=2016&recurring=one_time').
                call(callback);
        });
        this.When(/^I enter valid form information$/, function (callback) {
            helper.world.browser.
                setValue('select#s2id_donateWith', 'Card').
                setValue('input#card_number', '4242424242424242'). //Succeeded = 4111111111111111 Failed = 4444444444444448 CVV mismatch = 5112000200000002
                setValue('select#expiry_month', '12').
                setValue('select#expiry_year', '2015').
                setValue('input#cvv', '123'). //CVC failed = ''
                setValue('input#fname', 'John').
                setValue('input#lname', 'Doe').
                setValue('input#org', '').
                setValue('input#email_address', 'josh@trashmountain.org').
                setValue('input#email_address_verify', 'josh@trashmountain.org').
                setValue('input#phone', '(785) 246-6845').
                setValue('input#address_line1', 'Address Line 1').
                setValue('input#address_line2', 'Address Line 2').
                setValue('input#city', 'Topeka').
                setValue('input#region', 'KS').
                setValue('input#postal_code', '66618').
                setValue('input#amount', '1.03').
                submitForm('#donation_form').
                call(callback);
        });

        // Mimic the tokenization of the card, submission of the form and token to the Meteor method, and the API events from Stripe
        this.Then(/^My form data should be submitted to Stripe$/, function (callback) {
            // Write code here that turns the phrase above into concrete actions
            callback();
        });
        this.Then(/^I should be redirected to the thanks page$/, function (callback) {
            // Write code here that turns the phrase above into concrete actions
            helper.world.browser.
            waitForExist('#success_pending_icon', 5000).
            waitForVisible('#success_pending_icon', 5000).
            getText('h3', function (error, actualHeading) {
              if (error) {
                callback.fail(error.message);
              }
              assert.equal(actualHeading, "Thank you for your gift!");
              callback();
            });
        });
        this.When(/^I enter invalid form information$/, function (callback) {
            // Write code here that turns the phrase above into concrete actions
            callback.pending();
        });
        this.Then(/^I should see an invalid data error$/, function (callback) {
            // Write code here that turns the phrase above into concrete actions
            callback.pending();
        });
    };
})();
