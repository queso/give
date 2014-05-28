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

  function addACHToCustomer(customerID) {
    var payload = {
      name: 'John Doe',
      routing_number: '321174851',
      account_number: '9900000000'
    };

  // Create bank account
  balanced.configure(Meteor.settings.balancedPaymentsAPI);
  var customerData =  extractFromPromise(balanced.bankAccount.create(payload));
  console.log(customerData.href);
  }

Meteor.methods({
 createCustomer: function (data) {
      balanced.configure(Meteor.settings.balancedPaymentsAPI);
//      var customer = balanced.marketplace.customers.create();
      var customerData =  extractFromPromise(balanced.marketplace.customers.create());
      console.log(data.type);
      /*if (data.type === card) {
        var card = extractFromPromise(balanced.marketplace.cards.create({
          'number': '4111111111111111',
          'expiration_year': '2016',
          'expiration_month': '12',
          'cvv': '123'
        }));
        card.associate_to_customer(customerData).debit(data.amount).then(function (debit) {
          // save the result of the debit
        }, function (err) {
          // record the error message
        });
        } else {*/
          var check = extractFromPromise(balanced.marketplace.bank_accounts.create({
            "routing_number": "121000358", 
            "account_type": "checking", 
            "name": "Johann Bernoulli", 
            "account_number": "9900000001"
          }));
          check.associate_to_customer(customerData).debit(data.amount).then(function (debit) {
          // save the result of the debit
        }, function (err) {
          // record the error message
        });
        

      console.log(customerData.href);
      var customerID = Donate.insert({ customerURL: customerData.href });
      // this isn't ready yet
      //var printMe = addACHToCustomer(Donate.findOne(customerID).customerURL);
      //console.log(printMe); 

      //customerDataString returns a strange subset of the whole, not sure why this is
      //var customerDataString = JSON.stringify(customerData, undefined, 2);      
      //console.log(customerDataString);
      return customerData;
    },
  addBankAccount: function () {
    var payload = {
      name: 'John Doe',
      routing_number: '321174851',
      account_number: '9900000000'
    };

  // Create bank account
  balanced.configure(Meteor.settings.balancedPaymentsAPI);
  var customerData =  extractFromPromise(balanced.bankAccount.create(payload));
  console.log(customerData.href);
  },
  addCard: function () {
    var card = balanced.marketplace.cards.create({
      'number': '4111111111111111',
      'expiration_year': '2016',
      'expiration_month': '12',
      'cvv': '123'
    });
  }
});
