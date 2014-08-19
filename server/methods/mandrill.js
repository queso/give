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
      logger.info("EMAIL:");
      logger.info("Started email send out with API for id: ");
      logger.info(data);
      var status = Donate.findOne({_id: data}).debit.status;
      var error = Donate.findOne({_id: data}).failed.status;
      var email_address = Donate.findOne({_id: data}).customer.email_address;
      var donateTo = Donate.findOne({_id: data}).debit.donateTo;
      var donateWith = Donate.findOne({_id: data}).debit.donateWith;
      var amount = Donate.findOne({_id: data}).debit.amount;
      var total_amount = Donate.findOne({_id: data}).debit.total_amount;
      var fees = +total_amount - +amount;
      var coveredTheFees = Donate.findOne({_id: data}).debit.coveredTheFees;
      logger.info("Cover the fees? " + '\n' + coveredTheFees);
      logger.info("debit.status: " + status);
      var slug;
      if (status === "failed") {
        slug = "failedpayment";
        } else if (coveredTheFees){
        slug = "receiptincludesfees";
      } else {
        slug = "compatiblereceipt";
      }
      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: slug,
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
                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
                "content": donateWith
              }, {
                "name": "GiftAmount",
                "content": amount
              }, {
                "name": "GiftAmountFees",
                "content": fees
              }, {
                "name": "TotalGiftAmount",
                "content": total_amount
              }, {
                "name": "WhatWentWrong",
                "content": error
              }
            ]
          }
        ],
        toEmail: email_address
      });
    } //End try
    catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
    }
  }/*,
  failedPaymentSendEmail: function (data) {
    try {
      logger.info("Started email send out with API for failed payment. " + data);
      var email_address = Donate.findOne({'_id': data}).customer.email_address;
      logger.info("Email: " + email_address);
      var failureReason = 'Test failure'; //Donate.findOne({_id: data}).debit.failureReason;
      var donateWith = Donate.findOne({'_id': data}).debit.donateWith;
      var total_amount = Donate.findOne({'_id': data}).debit.total_amount;
      logger.info("Donate With: " + donateWith);
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
      logger.info('Mandril failedPaymentSendEmail Method error: ' + e);
    }
  }*/
});