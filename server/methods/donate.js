/*****************************************************************************/
/* Donate Methods */
/*****************************************************************************/

var Future = Npm.require("fibers/future");

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

function throwTheError(e){
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
}



function logIt() {
  logger.info("Started " + arguments.callee.caller.name);
}

Meteor.methods({
  processPayment: function (data) {
  logIt();

      // Moved the below from client side to here.  
      data._id = Donate.insert(data.created_at);
      console.log(data);
      
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
      console.log("Customer Info: " + JSON.stringify(customerInfo));
      logger.info(" =====> Customer "+ JSON.stringify(customerInfo) + " <=====");
      var paymentInfo = data.paymentInformation[0];
      console.log("Payment Info: " + JSON.stringify(paymentInfo));
      var customerData;

      try {
        customerData =  extractFromPromise(balanced.marketplace.customers.create({
        'name': customerInfo.fname + " " + customerInfo.lname,
        "address": {
          "city": customerInfo.city,
          "state": customerInfo.region,
          "line1": customerInfo.address_line1,
          "line2": customerInfo.address_line2,
          "postal_code": customerInfo.postal_code,
        },
        'email': customerInfo.email_address, 
        //need to add if statement for any fields that might be blank
        'phone': customerInfo.phone_number
        }));
      console.log("Customer: ");
      console.dir(JSON.stringify(customerData));
      Donate.update(data._id, {$set: {status: 'Customer created.'}});
      console.log("Customer created." + data._id);
    } catch (e) {
            var error = {};
            error.e = JSON.parse(e.message).errors[0];
            error.id = data._id;
            failTheRecord(error);
            throwTheError(e);
    }

      //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server
      // side function
      if (data.paymentInformation[0].type === "card") {
        //Tokenize card
        var card;
        try {
          card = extractFromPromise(balanced.marketplace.cards.create({
            'number': data.paymentInformation[0].card_number,
            'expiration_year': data.paymentInformation[0].expiry_year,
            'expiration_month': data.paymentInformation[0].expiry_month,
            'cvv': data.paymentInformation[0].cvv
          }));
          console.log("Card: ");
          console.dir(JSON.stringify(card));
            console.log(customerData.href);
          } 
          catch (e) {
            var error = {};
            error.e = JSON.parse(e.message).errors[0];
            error.id = data._id;
            failTheRecord(error);

            throwTheError(e);
          }

          //Debit function
          var associate;
          try {
            associate = extractFromPromise(card.associate_to_customer(customerData.href).debit({

            "amount": data.paymentInformation[0].total_amount * 100,
            "appears_on_statement_as": "Trash Mountain"}));
            console.log("Associate and debit: ");
            console.dir(JSON.stringify(associate));
          }
          catch (e) {
            var error = {};
            error.e = JSON.parse(e.message).errors[0];
            error.id = data._id;
            failTheRecord(error);

            throwTheError(e);
          }
        
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

          //add debit response from Balanced to the database
          var debitReponse = Donate.update(data._id, {$set: {
            'debit.type':   associate.type,
            'debit.customer': associate.links.customer,
            'debit.total_amount': associate.amount / 100,
            'debit.id': associate.id,
            'debit.status': associate.status
          }});      
        } 

        //for running ACH
        else {
          
          //Create bank account
          var check;
          try {
            check = extractFromPromise(balanced.marketplace.bank_accounts.create({
              "routing_number": data.paymentInformation[0].routing_number, 
              "account_type": data.paymentInformation[0].account_type, 
              "name": customerInfo.fname + " " + customerInfo.lname, 
              "account_number": data.paymentInformation[0].account_number,
              "appears_on_statement_as": "Trash Mountain"
            }));
            console.log("Check: ");
            console.dir(JSON.stringify(check));
            console.log(customerData.href);
          }
          catch (e) {
            var error = {};
            error.e = JSON.parse(e.message).errors[0];
            error.id = data._id;
            failTheRecord(error);
           
            throwTheError(e);
          }

          //Debit function
          var associate;

          try {
            associate = extractFromPromise(check.associate_to_customer(customerData.href).debit({

            "amount": data.paymentInformation[0].total_amount * 100,
            "appears_on_statement_as": "Trash Mountain"}));
            console.log("Associate and debit: ");
            console.dir(JSON.stringify(associate));
          }
          catch (e) {
            var error = {};
            error.e = JSON.parse(e.message).errors[0];
            error.id = data._id;
            failTheRecord(error);

            throwTheError(e);
          }

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
            'debit.type':   associate.type,
            'debit.customer': associate.links.customer,
            'debit.total_amount': associate.amount / 100,
            'debit.id': associate.id,
            'debit.status': associate.status
          }}); 
        }
      return data._id;
    },
    logNewGift: function(id) {
      try {
        var amount = Donate.findOne(id).debit.total_amount;
        logger.info("**********************NEW GIFT******************** id: " + id + " Total Amount: $" + amount)
      }
      catch (e) {
        throw new Meteor.error(e);
      }
    }
});
