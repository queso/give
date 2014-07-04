//Need to wrap in try catch for catching errors

Meteor.startup(function() {
  return Meteor.Mandrill.config({
    username: Meteor.settings.mandrillUsername
  });
});


//rewrite this to use many different templates, then store the data used to call those templates in the data var 
//before calling this function
Meteor.methods({
  sendEmailOutAPI: function (data) {
    try {
      console.log("started email send out with API");
      var email_address = Donate.findOne({_id: data}).customer.email_address;
      var donateTo = Donate.findOne({_id: data}).debit.donateTo;
      var donateWith = Donate.findOne({_id: data}).debit.doanteWith;
      var total_amount = Donate.findOne({_id: data}).debit.total_amount;

      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: "compatiblereceipt",
        templateContent: [
          {}
        ],
        mergeVars: [
          {
            "rcpt": email_address,
            "vars": [
              {
                "name": "DonatedTo",
                "content": donateTo
              }, {
                "name": "GiftAmount",
                "content": total_amount
              }
            ]
          }
        ],
        toEmail: email_address
      });
    } //End try
    catch (e) {
      console.log('Mandril sendEmailOutAPI Method error: ' + e);
    }
  },
  failedPaymentSendEmail: function (data) {
    try {
      console.log("Started email send out with API for failed payment. " + data);
      var email_address = Donate.findOne({'_id': data}).customer.email_address;
      console.log("Email: " + email_address);
      var failureReason = 'Test failure'; //Donate.findOne({_id: data}).debit.failureReason;
      var donateWith = Donate.findOne({'_id': data}).debit.donateWith;
      var total_amount = Donate.findOne({'_id': data}).debit.total_amount;
      console.log("Donate With: " + donateWith);
      if (donateWith == 'card') {
        donateWith = 'credit or debit card';
      } else {
        donateWith = 'bank account'
      }

      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: "failedpayment",
        templateContent: [
          {}
        ],
        mergeVars: [
          {
            "rcpt": email_address,
            "vars": [
              {
                "name": "WhatWentWrong",
                "content": failureReason
              }, {
                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
                "content": donateWith
              },{
                "name": "GiftAmount",
                "content": total_amount
              }
            ]
          }
        ],
        toEmail: email_address
      });
    } //End Try
    catch (e) {
      console.log('Mandril failedPaymentSendEmail Method error: ' + e);
    }
  }
});