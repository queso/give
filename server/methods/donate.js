/*****************************************************************************/
/* Donate Methods */
/*****************************************************************************/

var Future = Meteor.npmRequire("fibers/future");

function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
        fut.return(result);
    }, function (error) {
        console.log(error);
        //fut.throw(error);
    });
    return fut.wait();
}

function logIt() {
  logger.info("Started " + arguments.callee.caller.name);
}

Meteor.methods({
  singleDonation: function (data) {
  logIt();
    /*try {*/
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
        var customerData = Utils.create_customer(customerInfo, data._id);/*, function (error, result) {
            if (result) {
                customerData = result;
                console.log("Customer: ");
                console.dir(JSON.stringify(customerData));
                Donate.update(data._id, {$set: {status: 'Customer created.'}}); //TODO: Use this status inside the spinner to show that real things are happening.
                console.log("Customer created: " + data._id);
            } else {
                logger.error("Error returned from create_customer");
                //must have this Meteor error thrown here so that it returns an error to the cilent.
                throw new Meteor.Error(error);
            }
        });*/

        //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server
        // side function
        if (paymentInfo.type === "card") {
            //Tokenize card
            var card = Utils.card_create(data);/*, function (error, result) {
                if (result) {
                    card = result;
                    console.log("Card: ");
                    console.dir(JSON.stringify(card));
                } else {
                    logger.error("Error returned from card_create");
                    //must have this Meteor error thrown here so that it returns an error to the cilent.
                    throw new Meteor.Error(error);
                }
            });*/

            //Order function
            var orders = Utils.create_order(data._id, customerData.href);

            //Connect card with customer
            var associate = Utils.create_association(data, card.href, customerData.href);

            //Debit the order
            var debitOrder = Utils.debit_order(data, orders.href, card);
            /*try {
                Meteor.call('create_association', data, card.href, customerData.href, function(error, result){
                    if (result) {
                        associate = result;
                        console.log('********Total Amount = ' + data.paymentInformation[0].total_amount * 100);
                    }
                    else {
                        logger.error("Error returned from create_association");
                        //must have this Meteor error thrown here so that it returns an error to the cilent.
                        throw new Meteor.Error(500, e.reason, e.details);
                    }
                });
            } catch(e) {
                throw new Meteor.Error(500, e.reason, e.details);
            }*/






        }
        //for running ACH
        else {

            //Create bank account
            var check = Utils.check_create(data);/*, function (error, result) {
                if (result) {
                    check = result;
                    console.log("Check: ");
                    console.log("Adding check create response from Balanced to the collection.");
                } else {
                    logger.error("Error returned from check_create");
                    //must have this Meteor error thrown here so that it returns an error to the cilent.
                    throw new Meteor.Error(error);
                }
            });*/

            //Order function
            var orders = Utils.create_order(data._id, customerData.href);

            //Connect card with customer
            var associate = Utils.create_association(data, check.href, customerData.href);

            //Debit the order
            var debitOrder = Utils.debit_order(data, orders.href, check);

            //TODO: Can run the credit_to right here balanced.get('/orders/OR5EZkSOSTsmYJlJi6UlrUmp').credit_to(bank_account, 5000)
            //https://docs.balancedpayments.com/1.1/api/debits/#create-a-debit-for-an-order

           /* Meteor.call('create_association', data, check.href, customerData.href, function (error, result) {
                console.log("Back from create_association function: ");
                if (result) {
                    associate = result;
                }
                else {
                    logger.error("Error returned from create_association");
                    //must have this Meteor error thrown here so that it returns an error to the cilent.
                    throw new Meteor.Error(error);
                }
            });*/
        }
        return data._id;

    /*} catch (e) {
            logger.error("Got to catch error area of processPayment function." + e);
            logger.error("e.category_code = " + e.category_code + " e.descriptoin = " + e.description);
            throw new Meteor.Error(500, e.category_code, e.description);
        }*/
    }
});
