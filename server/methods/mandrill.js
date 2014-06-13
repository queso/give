Meteor.startup(function() {
  return Meteor.Mandrill.config({
    username: Meteor.settings.mandrillUsername
  });
});


//rewrite this to use many different templates, then store the data used to call those templates in the data var 
//before calling this function
Meteor.methods({
  sendEmailOutAPI: function (data) {
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
  }
});
