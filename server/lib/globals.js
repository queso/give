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

            //update the collection with this invoice
            Donate.update({_id: IDs.id}, {
              $push: {
                'recurring.invoices': invoice.data
              }
            });
            return IDs;
        }else{
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
          is_recurring: Match.OneOf("one_time", "monthly"),
          coverTheFees: Boolean, 
          created_at: String,
          type: Match.OneOf("Card", "Check"),
          card_number: Match.Optional(String),
          expiry_month: Match.Optional(String),
          expiry_year: Match.Optional(String),
          cvv: Match.Optional(String),
          account_number: Match.Optional(String),
          account_type: Match.Optional(String),
          routing_number: Match.Optional(String),
          fees: Match.Optional(Number)
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