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
    checkInputs: function(form) {
        return typeof form.customer[0].fname;
    },
    getBillySubscriptionGUID: function(invoiceID){
        var IDs = {};
        var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoiceID, {
                auth: Meteor.settings.billyKey + ':'
        });
        IDs.subscription_guid = invoice.data.subscription_guid;
        logger.info("Got the subscription_guid: " + IDs.subscription_guid);
        if(Donate.findOne({'recurring.subscriptions.guid': IDs.subscription_guid})){
            IDs._id = Donate.findOne({'recurring.subscriptions.guid': subscription_guid})._id;
            logger.info("Got the _id: " + IDs._id);
        }else{
            logger.error("Couldn't find the subscription for this invoice...bummer: " + invoiceID);
            return;
        }
        Donate.update({
                _id: IDs._id,
                'recurring.subscriptions.guid': IDs.subscription_guid}, {
                $push: {
                    'recurring.subscriptions.$.invoices': invoice
                }
            });
        return IDs;
    },
    getInvoice: function(subGUID){
        var resultSet;
        resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
            auth: Meteor.settings.billyKey + ':'
        });
        return resultSet;
    }

};