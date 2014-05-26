/*****************************************************************************/
/* Donate Methods */
/*****************************************************************************/
Meteor.startup(function() {
  return Meteor.Mandrill.config({
    username: "josh@trashmountain.com",
    key: "f9trMQWLtBo4XDsxZd97yw"
  });
});


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
 createCustomer: function () {
      balanced.configure(Meteor.settings.balancedPaymentsAPI);
//      var customer = balanced.marketplace.customers.create();
      var customerData =  extractFromPromise(balanced.marketplace.customers.create());
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
  sendEmailOut: function (data) {
    console.log(data);
    var to = data.to;
    var subject = data.subject;
  return Meteor.Mandrill.send({
    to: to,
    from: 'josh@trashmountain.com',
    subject: subject,
    html: '<html><body>Test html body</body></html>'
  });
  }
});
