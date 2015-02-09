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
    getBillySubscriptionGUID: function(invoiceID){
        var IDs = {};
        var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoiceID, {
                auth: Meteor.settings.billy_key + ':'
        });
        logger.info("getBillySubscriptionGUID");
        IDs.subscription_guid = invoice.data.subscription_guid;
        logger.info("Got the subscription_guid: " + IDs.subscription_guid);
        if(Donate.findOne({'subscriptions.guid': IDs.subscription_guid})){
            IDs.id = Donate.findOne({'subscriptions.guid': IDs.subscription_guid})._id;
            logger.info("Got the _id: " + IDs.id);

            return IDs;
        }else if (Donate.findOne({'recurring.subscriptions.guid': IDs.subscription_guid})){
            logger.warn("Need to remove this from recurring since that is no longer used.");
            IDs.id = Donate.findOne({'recurring.subscriptions.guid': IDs.subscription_guid})._id;
            logger.info("Got the _id: " + IDs.id);

            return IDs;
        }
        else{
            logger.error("Couldn't find the subscription for this invoice...bummer: " + invoiceID);
            throw new Meteor.Error(404, 'Error 404: Not found', invoiceID); 
        }        
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
    }
};