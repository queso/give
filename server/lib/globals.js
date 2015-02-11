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
        logger.info("Started create_user.");

        var email_address = Customers.findOne(customer_id).email;
        var user_id = Meteor.users.findOne({'emails.address': email_address});
        var name = Customers.findOne(customer_id).name;

        if(!user_id){

            user_id = Accounts.createUser({email: email_address});

            if(debit_id){
                var waitForInsert = Utils.link_gift_to_user(customer_id, donation_id, debit_id, user_id);
            }

            //Get all the persona_ids from DT for this email address
            var persona_id = Utils.get_dt_id(email_address, name, user_id, donation_id);
            Utils.get_all_dt_donations(persona_id);

            Accounts.sendEnrollmentEmail(user_id);
            Meteor.users.update(user_id, {$set: {'profile.name': name, 'primary_customer_id': customer_id, 'persona_id': persona_id}});
        } else {
           logger.info("User already exists.");
            // This doesn't work, need to figure out a better way to call the insert
            // Utils.insert_donation_into_dt(donation_id, Meteor.users.findOne(user_id).persona_id[0], user_id);
            if(debit_id){
                Utils.link_gift_to_user(customer_id, donation_id, debit_id, user_id);
            }
        }
        return;

    },
    link_gift_to_user: function(customer_id, donation_id, debit_id, userId) {
        logger.info("Started link_gift_to_user.");
        try {
            var insertThis = {};
            insertThis.customers = {};
            insertThis.customers = customer_id;
            insertThis.donations = donation_id;
            insertThis.debits = debit_id;

            Meteor.users.update(userId, {$addToSet: insertThis});
        } catch (e) {
            logger.error(e);
        }
    },
    test_job: function (address, subject, message) {
        console.log("Address: " + address);
        console.log("Subject: " + subject);
        console.log("Message: " + message);
    }
};