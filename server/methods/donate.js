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
        fut.throw(error);
    });
    return fut.wait();
}

/*function throwTheError(e){
  console.log("Extras: " + JSON.parse(e.message).errors[0].extras);
  console.log("Category Code: " + JSON.parse(e.message).errors[0].category_code);
  console.log("All Errors: " + JSON.parse(e.message).errors[0]);
  var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
  logger.error(JSON.stringify(error, null, 4));

  throw new Meteor.Error(error);
}


function failTheRecord(data) {
  logger.error("Error for this ID: " + data.id);
  logger.error(JSON.stringify(data.e, null, 4));
      // Update this record to reflect failed status.
      Donate.update(data.id, {
        $set: {
          failed: data.e
        }
      });
      return;
}*/
/*function throwTheError(e){
    logger.error("Category Code: " + e.category_code);
    logger.error("Error Description: " + e.description);
    logger.error(e);
    //throw new Meteor.Error(e);
}


function failTheRecord(errorWithID) {
    logger.error("Category Code: " + errorWithID.e.category_code);
    logger.error("Error Description: " + errorWithID.e.description);
    logger.error("Error for this ID: " + errorWithID.id);
    logger.error("Error: " + errorWithID.e);
    // Update this record to reflect failed status.
    Donate.update(errorWithID.id, {
        $set: {
            failed: errorWithID.e
        }
    });
    return;
}*/

function logIt() {
  logger.info("Started " + arguments.callee.caller.name);
}

Meteor.methods({
  processPayment: function (data) {
  logIt();
    try {
        // Moved the below from client side to here.
        data._id = Donate.insert({created_at: data.paymentInformation[0].created_at});
        console.log(data._id);

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
                'debit.coveredTheFees': data.paymentInformation[0].coverTheFees
            }
        });

        // ^^^^^^^^^^^^^^^ Moved the above from the client side to here.
        //initialize the balanced function with our API key.
        balanced.configure(Meteor.settings.balancedPaymentsAPI);

        var customerInfo = data.customer[0];
        var paymentInfo = data.paymentInformation[0];
        var customerData;
        Meteor.call('create_customer', customerInfo, function (error, result) {
            if (result) {
                customerData = result;
                console.log("Customer: ");
                console.dir(JSON.stringify(customerData));
                Donate.update(data._id, {$set: {status: 'Customer created.'}}); //TODO: Use this status inside the spinner to show that real things are happening.
                console.log("Customer created: " + data._id);
            } else {
                var errorWithID = {};
                errorWithID.e = error;
                errorWithID.id = data._id;
                failTheRecord(errorWithID);
                throwTheError(error);
            }
        });

        //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server
        // side function
        if (paymentInfo.type === "card") {
            //Tokenize card
            var card;
            Meteor.call('card_create', data, function (error, result) {
                if (result) {
                    card = result;
                    console.log("Card: ");
                    console.dir(JSON.stringify(card));
                } else {
                    console.log("error returned");
                    /*console.log("ERROR: " + error.errors.category_code);
                    logger.error(JSON.stringify(error, null, 4));
                    throw new Meteor.Error(500, error.errors.category_code, error.errors.description)*/;/*var errorWithID = {};
                    errorWithID.e = error;
                    errorWithID.id = data._id;
                    failTheRecord(errorWithID);
                    throwTheError(error);*/
                }
            });

            //Debit function
            var associate;
            Meteor.call('create_association', data, card.href, customerData.href, function (error, result) {
                if (result) {
                    associate = result;
                    console.log('********Total Amount = ' + data.paymentInformation[0].total_amount * 100);
                }
                else {
                    console.dir(error.reason.errors);
                    //logger.error(JSON.stringify(error, null, 4));
                    throw new Meteor.Error(500, error.category_code, error.description);/*var errorWithID = {};
                     errorWithID.e = error;
                     errorWithID.id = data._id;
                     failTheRecord(errorWithID);
                     throwTheError(error);*/
                 }
            });

            //add debit response from Balanced to the database
            var debitReponse = Donate.update(data._id, {$set: {
                'debit.type': associate.type,
                'debit.customer': associate.links.customer,
                'debit.total_amount': associate.amount / 100,
                'debit.id': associate.id,
                'debit.status': associate.status,
                'card_holds.id': associate.links.card_hold
            }});

            //add customer create response from Balanced to the database
            var customerResponse = Donate.update(data._id, {$set: {
                'customer.type': customerData._type,
                'customer.id': customerData.id
            }});

            //add card create response from Balanced to the database
            var cardResponse = Donate.update(data._id, {$set: {
                'card.type': card._type,
                'card.id': card.id
            }});
        }
        //for running ACH
        else {

            //Create bank account
            var check;
            Meteor.call('check_create', data, function (error, result) {
                if (result) {
                    check = result;
                    console.log("Check: ");
                    console.log("Adding check create response from Balanced to the collection.");
                } else {
                    var errorWithID = {};
                    errorWithID.e = error;
                    errorWithID.id = data._id;
                    failTheRecord(errorWithID);
                    throwTheError(error);
                }
            });
            var checkVerify;
            var associate;
            Meteor.call('create_association', data, check.href, customerData.href, function (error, result) {
                console.log("Back from create_association function: ");
                if (result) {
                    associate = result;
                }
                else {
                    /*var errorWithID = {};
                    errorWithID.e = error;
                    errorWithID.id = data._id;
                    failTheRecord(errorWithID);*/
                    throwTheError(error);
                }
            });

            //add customer create response from Balanced to the database
            var customerResponse = Donate.update(data._id, {$set: {
                'customer.type': customerData._type,
                'customer.id': customerData.id
            }});

            //add check create response from Balanced to the database
            var checkResponse = Donate.update(data._id, {$set: {
                'bank_account.type': check._type,
                'bank_account.id': check.id
            }});

            //add debit response from Balanced to the database

            var debitReponse = Donate.update(data._id, {$set: {
                'debit.type': associate.type,
                'debit.customer': associate.links.customer,
                'debit.total_amount': associate.amount / 100,
                'debit.id': associate.id,
                'debit.status': associate.status
            }});
        }
        return data._id;
    } catch (e) {
        logger.error("Got to catch error area of processPayment function.");
        var errorWithID = {};
        errorWithID.e = e;
        errorWithID.id = data._id;
        failTheRecord(errorWithID);
        throwTheError(e);
    }
    },
    logNewGift: function(id) {
      try {
        var amount = Donate.findOne(id).debit.total_amount;
        logger.info("**********************NEW GIFT******************** id: " + id + " Total Amount: $" + amount)
      }
      catch (e) {
        logger.error(e);
        throw new Meteor.error(e);
      }
    }
});
