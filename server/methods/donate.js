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
        data._id = Donate.insert({created_at: data.paymentInformation[0].created_at});

        Donate.update(data._id, {
            $set: {
                sessionId: data.sessionId,
                URL: data.URL,
                'customer': data.customer[0],
                'debit.donateTo': data.paymentInformation[0].donateTo,
                'debit.donateWith': data.paymentInformation[0].donateWith,
                'debit.email_sent': false,
                'debit.type': data.paymentInformation[0].type,
                'debit.total_amount': data.paymentInformation[0].total_amount,
                'debit.amount': data.paymentInformation[0].amount,
                'debit.fees': data.paymentInformation[0].fees,
                'debit.coveredTheFees': data.paymentInformation[0].coverTheFees,
                'debit.status': 'pending'
            }
        });

        // ^^^^^^^^^^^^^^^ Moved the above from the client side to here.
        //initialize the balanced function with our API key.
        balanced.configure(Meteor.settings.balancedPaymentsAPI);

        var customerInfo = data.customer[0];
        var paymentInfo = data.paymentInformation[0];
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
             throw new Meteor.Error(500, e.category_code, e.description);
         }else {
             throw new Meteor.Error(500, e.reason, e.details);
         }
         }
    }
});
