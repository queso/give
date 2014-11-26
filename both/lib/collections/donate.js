Donate = new Meteor.Collection('donate');
if (Meteor.isServer) {
    Donate._ensureIndex({'transactions.guid': 1}, {background: true});
    Donate._ensureIndex({'subscriptions.guid': 1}, {background: true});
    Donate._ensureIndex({'invoices.guid': 1}, {background: true});
    Donate._ensureIndex({'customer.id': 1}, {background: true});
}
