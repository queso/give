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
    console.log(data);
    Meteor.Mandrill.sendTemplate({
      key: Meteor.settings.mandrillKey,
      templateSlug: "compatiblereceipt",
      templateContent: [
        {}
      ],
      mergeVars: [
        {
          "rcpt": data.email,
          "vars": [
            {
              "name": "DonatedTo",
              "content": data.donateTo
            }, {
              "name": "GiftAmount",
              "content": data.total_amount
            }
          ]
        }
      ],
      toEmail: data.email
    });
  }
});
