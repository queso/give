//Record Donor Tools funds for reference with Donor Tools donations
DT_funds = new Meteor.Collection('dt_funds');
if (Meteor.isServer) {
    //Setup other indexes for faster and better searching
    DT_funds._ensureIndex({'name': 1}, {background: true});

    DT_funds.deny({
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

    DT_funds.allow({
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
