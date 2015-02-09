//Record Donor Tools donations
DT_donations = new Meteor.Collection('dt_donations');
if (Meteor.isServer) {
    //Setup other indexes for faster and better searching
    DT_donations._ensureIndex({'persona_id': 1}, {background: true});
    DT_donations._ensureIndex({'transaction_id': 1}, {background: true});

    DT_donations.deny({
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

    DT_donations.allow({
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
}
