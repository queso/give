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

Meteor.methods({
 createCustomer: function (data) {
      balanced.configure(Meteor.settings.balancedPaymentsAPI);
      var customerInfo = data.customer[0];
      console.log("Customer Info: " + customerInfo);


      var paymentInfo = data.paymentInformation[0];
      console.log(paymentInfo);
      var customerData =  extractFromPromise(balanced.marketplace.customers.create({
        'name': customerInfo.fname + " " + customerInfo.lname,
        "address": {
          "city": customerInfo.city,
          "state": customerInfo.region,
          "line1": customerInfo.address_line1,
          "line2": customerInfo.address_line2,
          "postal_code": customerInfo.postal_code,
        },
        'email': customerInfo.email_address, 
        'phone': customerInfo.phone_number
        }));
      console.log("Customer: ");
      console.dir(JSON.stringify(customerData));

      //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server
      // side function
      if (data.paymentInformation[0].type === "card") {
        var card = extractFromPromise(balanced.marketplace.cards.create({
          'number': paymentInfo.card_number,
          'expiration_year': paymentInfo.expiry_year,
          'expiration_month': paymentInfo.expiry_month,
          'cvv': paymentInfo.cvv
        }));
        console.log("Card: ");
        console.dir(JSON.stringify(card));
          console.log(customerData.href);
            var associate = extractFromPromise(card.associate_to_customer(customerData.href).debit({
          "amount": data.paymentInformation[0].total_amount*100,
          "appears_on_statement_as": "Trash Mountain" }));    
        console.log("Associate and debit: ");
        console.dir(JSON.stringify(associate));
        
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
            'debit.id': associate.id
          }});      
        } 

        //for running ACH
        else {
          var check = extractFromPromise(balanced.marketplace.bank_accounts.create({
            "routing_number": paymentInfo.routing_number, 
            "account_type": paymentInfo.account_type, 
            "name": customerInfo.fname + " " + customerInfo.lname, 
            "account_number": paymentInfo.account_number,
            "appears_on_statement_as": "Trash Mountain"
          }));
console.log("Check: ");
console.dir(JSON.stringify(check));
console.log(customerData.href);
          var associate;

          try {
            associate = extractFromPromise(check.associate_to_customer(customerData.href).debit({

            "amount": paymentInfo.total_amount * 100,
            "appears_on_statement_as": "Trash Mountain"}));
            console.log("Associate and debit: ");
            console.dir(JSON.stringify(associate));
          }
          catch (e) {
            console.log(JSON.parse(e.message).errors[0].extras);            
          }
            var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
            throw new Meteor.Error(error.status_code, error.description, error.extras);
          }

          //add customer create response from Balanced to the database
          var customerResponse = Donate.update(data._id, {$set: {
            'customer.type': customerData._type,
            'customer.id': customerData.id
          }});

          //add card create response from Balanced to the database
          var checkResponse = Donate.update(data._id, {$set: {
            'bank_account.type': check._type,
            'bank_account.id': check.id
          }});

          //add debit response from Balanced to the database
          var debitReponse = Donate.update(data._id, {$set: {
            'debit.type':   associate.type,
            'debit.customer': associate.links.customer,
            'debit.total_amount': associate.amount / 100,
            'debit.id': associate.id
          }}); 
        }
      return associate;
    },

    chargeExistingCard: function (data) {
      console.log("Started Charge Existing Card Method");

      balanced.configure(Meteor.settings.balancedPaymentsAPI);
      
      
      var debit = extractFromPromise(balanced.get(data.href).debit({
        "amount": data.total_amount * 100,
        "appears_on_statement_as": "Trash Mountain",
        "description": data.description
      }));

    }
});
