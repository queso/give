Debits = new Meteor.Collection('debits');

//Setup indexes for faster collection
/*
if (Meteor.isServer) {
    Sources._ensureIndex({'id': 1}, {background: true});
    Sources._ensureIndex({'customer_id': 1}, {background: true});
    Sources._ensureIndex({'invoices.id': 1}, {background: true});
    Sources._ensureIndex({'orders.id': 1}, {background: true});
    Sources._ensureIndex({'debits.id': 1}, {background: true});
    Sources._ensureIndex({'transactions.id': 1}, {background: true});
    Sources._ensureIndex({'subscriptions.id': 1}, {background: true});
}*/
