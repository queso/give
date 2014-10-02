/* Donate Methods */
/*****************************************************************************/

function logIt() {
    logger.info("Started " + arguments.callee.caller.name);
}

Meteor.methods({
    singleDonation: function (data) {
        logIt();
        try {
        // Moved the below from client side to here.
        data._id = Donate.insert({created_at: data.paymentInformation.created_at});

        Donate.update(data._id, {
            $set: {
                sessionId: data.sessionId,
                URL: data.URL,
                'customer': data.customer,
                'debit.donateTo': data.paymentInformation.donateTo,
                'debit.donateWith': data.paymentInformation.donateWith,
                'debit.email_sent': false,
                'debit.type': data.paymentInformation.type,
                'debit.total_amount': data.paymentInformation.total_amount,
                'debit.amount': data.paymentInformation.amount,
                'debit.fees': data.paymentInformation.fees,
                'debit.coveredTheFees': data.paymentInformation.coverTheFees,
                'debit.status': 'pending'
            }
        });
        logger.info("ID: " + data._id);

        // ^^^^^^^^^^^^^^^ Moved the above from the client side to here.
        //initialize the balanced function with our API key.
        balanced.configure(Meteor.settings.balanced_api_key);

        var customerInfo = data.customer;
        var paymentInfo = data.paymentInformation;
        var customerData = Utils.create_customer(customerInfo, data._id);

        //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server
        // side function
        if (paymentInfo.type === "Card") {
            //Tokenize card
            var card = Utils.card_create(data);

            //Order function
            var orders = Utils.create_order(data._id, customerData.href);

            //Connect card with customer
            var associate = Utils.create_association(data, card.href, customerData.href);

            //Debit the order
            var debitOrder = Utils.debit_order(data, orders.href, card);

        }
        //for running ACH
        else {

            //Create bank account
            var check = Utils.check_create(data);
            //Order function
            var orders = Utils.create_order(data._id, customerData.href);

            //Connect bank account with customer
            var associate = Utils.create_association(data, check.href, customerData.href);

            //Debit the order
            var debitOrder = Utils.debit_order(data, orders.href, check);

        }
        return data._id;

        } catch (e) {
         logger.error("Got to catch error area of processPayment function." + e + " " + e.reason);
         logger.error("e.category_code = " + e.category_code + " e.descriptoin = " + e.description);
         if(e.category_code) {
            logger.error("Got to catch error area of create_associate. ID: " + data._id + " Category Code: " + e.category_code + ' Description: ' + e.description);
            Donate.update(data._id, {
                $set: {
                    'failed.category_code': e.category_code,
                    'failed.description': e.description,
                    'debit.status': 'failed'
                }
            });
            throw new Meteor.Error(500, e.category_code, e.description);
         }else {
             throw new Meteor.Error(500, e.reason, e.details);
         }
         }
    }
});
