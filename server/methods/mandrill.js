Meteor.startup(function() {
  return Meteor.Mandrill.config({
    username: "Meteor.settings.mandrillUsername",
    key: "Meteor.settings.mandrillKey"
  });
});

Meteor.methods({
  sendEmailOutAPI: function (data) {
    greet("SERVER");
    Meteor.Mandrill.sendTemplate({
      key: "f9trMQWLtBo4XDsxZd97yw",
      templateSlug: "compatiblereceipt",
      templateContent: [
        {}
      ],
      mergeVars: [
        {
          "rcpt": data.to,
          "vars": [
            {
              "name": "DonatedTo",
              "content": data.donatedTo
            }, {
              "name": "GiftAmount",
              "content": data.amount
            }
          ]
        }
      ],
      toEmail: data.to
    });
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
