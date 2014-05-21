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

Meteor.methods({
 createCustomer: function () {
      balanced.configure(Meteor.settings.balancedPaymentsAPI);
      var customer = balanced.marketplace.customers.create();
      var customerData =  extractFromPromise(customer);
      var customerDataString = JSON.stringify(customerData, undefined, 2);      
      console.log(customerDataString);
      console.log(customerDataString.href);
      return customerData;
    }
});
