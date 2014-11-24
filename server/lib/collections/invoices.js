Invoices = new Meteor.Collection('invoices');

Invoices.allow({
    insert: function (userId, doc) {
        return false;
    },

    update: function (userId, doc, fieldNames, modifier) {
        return false;
    },

    remove: function (userId, doc) {
        return false;
    }
});

Invoices.deny({
    insert: function (userId, doc) {
        return true;
    },

    update: function (userId, doc, fieldNames, modifier) {
        return true;
    },

    remove: function (userId, doc) {
        return true;
    }
});