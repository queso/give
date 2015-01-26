var Future = Meteor.npmRequire("fibers/future");

Utils = {
    extractFromPromise: function(promise) {
        var fut = new Future();
        promise.then(function (result) {
            fut.return(result);
        }, function (error) {
            logger.info(error);
            fut.throw(error);
        });
        return fut.wait();
    },
    getInvoice: function(subGUID){
        var resultSet;
        resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
            auth: Meteor.settings.billy_key + ':'
        });
        return resultSet;
    },
    checkFormFields: function(form) {

      check(form, 
        {paymentInformation: {
          amount: Match.Integer, 
          total_amount: Match.Integer, 
          donateTo: String, 
          donateWith: Match.OneOf("Card", "Check"), 
          is_recurring: Match.OneOf("one_time", "monthly", "weekly", "daily"),
          coverTheFees: Boolean, 
          created_at: String,
          type: Match.OneOf("Card", "Check"),
          href: Match.Optional(String),
          id: Match.Optional(String),
          fees: Match.Optional(Number),
          writeIn: Match.Optional(String),
          start_date: Match.Optional(String),
          later: Match.Optional(Boolean)
        },
        customer: {
          fname: String, 
          lname: String, 
          org: Match.Optional(String), 
          email_address: String, 
          phone_number: Match.Optional(String), 
          address_line1: String,
          address_line2: String, 
          region: String, 
          city: String, 
          postal_code: String, 
          country: String, 
          created_at: String}, 
        URL: String, 
        sessionId: String
      });
    },
    checkLoginForm: function(form){
      check(form, {
          username: String,
          password: String
      });
    },
    create_user: function (customer_id, donation_id, debit_id) {
        var email_address = Customers.findOne(customer_id).email;
        var user_id = Meteor.users.findOne({'emails.address': email_address});
        if(!user_id){
            var name = Customers.findOne(customer_id).name;
            user_id = Accounts.createUser({email: email_address});
            Accounts.sendEnrollmentEmail(user_id);
            Meteor.users.update(user_id, {$set: {'profile.name': name, 'primary_customer_id': customer_id}});
        } else {
            console.log("User already exists.");
        }
        if(debit_id){
            Utils.linkGiftToUser(customer_id, donation_id, debit_id, user_id);
        }
    },
    linkGiftToUser: function(customer_id, donation_id, debit_id, userId) {
        var insertThis = {};
        insertThis.customers = {};
        insertThis.customers = customer_id;
        insertThis.donations =  donation_id;
        insertThis.debits = debit_id;

        Meteor.users.update(userId, {$push: insertThis});
    }
};