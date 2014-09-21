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
    getBillySubscriptionGUID: function(description){
        var invoiceID = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
        //https://billy.balancedpayments.com/v1/invoices/IV6PmZZTbM7BcwMRhD2rSBam -u GngRMhnziCPpQxyNDMaNKWmBhPYyK3Bt4ERADwg6UDgv:
            var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoiceID, {
                    auth: Meteor.settings.billyKey + ':'
            });
        var subscription_guid = invoice.data.subscription_guid;
        console.log("LOOK HERE ******************** " + subscription_guid)
        if(Donate.findOne({'recurring.subscription.guid': subscription_guid})){
            var id = Donate.findOne({'recurring.subscription.guid': subscription_guid})._id;
        }
        Donate.update(id, {
            $push: {
                'recurring.invoices': invoice
            }
        });
        return id;
    },
    getInvoice: function(subGUID){
        var resultSet;
        resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
            auth: Meteor.settings.billyKey + ':'
        });
        return resultSet;
    }

};