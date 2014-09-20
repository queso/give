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

      var error = {};
      var debit = Donate.findOne({_id: data}).debit;
      var customer = Donate.findOne({_id: data}).customer;
      var fees = +debit.total_amount - +debit.amount;
      logger.info("Cover the fees = " + debit.coveredTheFees);
      logger.info("debit.status: " + debit.status);
      var slug;
      if (debit.status === "failed") {
        error = Donate.findOne({_id: data}).failed;
        slug = "failedpayment";
        } else if (debit.coveredTheFees){
        slug = "fall-2014-donation-electronic-receipt-with-fees";
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
                "name": "FailureReason",
                "content": error.failure_reason
               },{
                "name": "FailureReasonCode",
                "content": error.failure_reason_code
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
  }
});