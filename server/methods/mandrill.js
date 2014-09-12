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

      var error;
      var debit = Donate.findOne({_id: data}).debit;
      var customer = Donate.findOne({_id: data}).customer;
      var fees = +debit.total_amount - +debit.amount;
      logger.info("Cover the fees = " + debit.coveredTheFees);
      logger.info("debit.status: " + debit.status);
      var slug;
      if (debit.status === "failed") {
        error = Donate.findOne({_id: data}).debit.status;
        slug = "failedpayment";
        } else if (debit.coveredTheFees){
        slug = "receiptincludesfees";
      } else {
        slug = "fall-2014-donation-electronic-receipt";
      }
      Meteor.Mandrill.sendTemplate({
        key: Meteor.settings.mandrillKey,
        templateSlug: slug,
        templateContent: [
          {}
        ],
        mergeVars: [
          {
            "rcpt": customer.email_address,
            "vars": [
              {
                "name": "DonatedTo",
                "content": debit.donateTo
              }, {
                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
                "content": debit.donateWith
              }, {
                "name": "GiftAmount",
                "content": debit.amount
              }, {
                "name": "GiftAmountFees",
                "content": fees
              }, {
                "name": "TotalGiftAmount",
                "content": debit.total_amount
              }, {
                "name": "WhatWentWrong",
                "content": error
              },{
                "name": "FNAME",
                "content": customer.fname
            }, {
                "name": "LNAME",
                "content": customer.lname
            }, {
                "name": "ADDRESS_LINE1",
                "content": customer.address_line1
            }, {
                "name": "ADDRESS_LINE2",
                "content": customer.address_line2
            }, {
                "name": "LOCALITY",
                "content": customer.city
            }, {
                "name": "REGION",
                "content": customer.region
            }, {
                "name": "POSTAL_CODE",
                "content": customer.postal_code
            }, {
                "name": "PHONE",
                "content": customer.phone_number
            }, {
                "name": "ReceiptNumber",
                "content": data
            }
            ]
          }
        ],
        toEmail: customer.email_address
      });
    } //End try
    catch (e) {
      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
      throw new Meteor.error(e);
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