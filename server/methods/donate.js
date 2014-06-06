/*****************************************************************************/
/* Donate Methods */
/*****************************************************************************/

var Future = Npm.require("fibers/future");

  function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
      fut["return"](result);
    }, function (error) {
      fut["throw"](error);
    });
    return fut.wait();
  }

function updateMe() {
  var query = Donate.find({email_sent: undefined});

  var handle = query.observeChanges({
     changed: function(id, fields) {
          var sendToEmail = {};
          sendToEmail.email =  Donate.findOne(this.params._id).email_address;
          sendToEmail.donateTo =  Donate.findOne(this.params._id).donateTo;
          sendToEmail.total_amount =  Donate.findOne(this.params._id).total_amount;
          sendToEmail.id = Donate.findOne(this.params._id)._id;
          console.log(sendToEmail);
          Meteor.call("sendEmailOutAPI", sendToEmail, function() {
          });

  }
  });
  handle.stop();
}

Meteor.methods({
 createCustomer: function (data) {

      updateMe();
      balanced.configure(Meteor.settings.balancedPaymentsAPI);

      var customerData =  extractFromPromise(balanced.marketplace.customers.create({
        'name': data.fname + " " + data.lname,
        "address": {
          "city": data.city,
          "state": data.region,
          "line1": data.address_line1,
          "line2": data.address_line2,
          "postal_code": data.postal_code,
        },
        'email': data.email_address, 
        'phone': data.phone_number
        }));
      
      //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server
      // side function
      if (data.type === "card") {
        var card = extractFromPromise(balanced.marketplace.cards.create({
          'number': data.card_number,
          'expiration_year': data.expiry_year,
          'expiration_month': data.expiry_month,
          'cvv': data.cvv
        }));
          try {
            var associate = extractFromPromise(card.associate_to_customer(customerData.href).debit({
          "amount": data.total_amount*100,
          "appears_on_statement_as": "Trash Mountain" }));  
          } catch (e){
            throw new Meteor.Error(400, e)
          }     

        //add customer create response from Balanced to the database
        var customerResponse = Donate.update(data._id, {$set: {
          customerHref: customerData.href,  
          customerType: customerData.type,
        }});

        //add card create response from Balanced to the database
        var cardResponse = Donate.update(data._id, {$set: {
          cardHref: card.href,
          cardType: card.type
        }});

        //add debit response from Balanced to the database
        var debitReponse = Donate.update(data._id, {$set: {
          debitStatus: associate.status,
          debitHREF:  associate.href,
          deitType:   associate.type,
          debitAmount: associate.amount,
          debitFailureReaons: associate.failure_reason
        }});        
        } 

        //for running ACH
        else {
          var check = extractFromPromise(balanced.marketplace.bank_accounts.create({
            "routing_number": data.routing_number, 
            "account_type": data.account_type, 
            "name": data.fname + " " + data.lname, 
            "account_number": data.account_number,
            "appears_on_statement_as": "Trash Mountain"
          }));

          var associate = extractFromPromise(check.associate_to_customer(customerData.href).debit({
            "amount": data.total_amount * 100,
            "appears_on_statement_as": "Trash Mountain"}));

          //add customer create response from Balanced to the database
          var customerResponse = Donate.update(data._id, {$set: {customerData: customerData}});

          //add card create response from Balanced to the database
          var cardResponse = Donate.update(data._id, {$set: {
            checkReponse: check
          }});

          //add debit response from Balanced to the database
          var debitReponse = Donate.update(data._id, {$set: {
            debitHREF:  associate.href,
            deitType:   associate.type
          }}); 

          //add customer create response from Balanced to the database
          var customerID = Donate.update(data._id, {$set: {customerData: customerData}});
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
