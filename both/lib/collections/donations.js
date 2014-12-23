//Record donations, including amount, frequency, designation, source and day or days of month for recurring gifts
Donations = new Meteor.Collection('donations');
if (Meteor.isServer) {
    //Setup other indexes for faster and better searching
    Donations._ensureIndex({'transactions.guid': 1}, {background: true});
    Donations._ensureIndex({'subscriptions.guid': 1}, {background: true});
    Donations._ensureIndex({'invoices.guid': 1}, {background: true});
    Donations._ensureIndex({'order.id': 1}, {background: true});
    Donations._ensureIndex({'customer_id': 1}, {background: true});

    Donations.deny({
        insert: function (userId, doc) {
            if(userId === Meteor.settings.admin_user){
                return false;
            } else{
                return true;
            }
        },

        update: function (userId, doc, fieldNames, modifier) {
            if(userId === Meteor.settings.admin_user){
                return false;
            } else{
                return true;
            }
        },

        remove: function (userId, doc) {
            if(userId === Meteor.settings.admin_user){
                return false;
            } else{
                return true;
            }
        }
    });

    Donations.allow({
        insert: function (userId, doc) {
            if(userId === Meteor.settings.admin_user){
                return true;
            } else{
                return false;
            }
        },

        update: function (userId, doc, fieldNames, modifier) {
            if(userId === Meteor.settings.admin_user){
                return true;
            } else{
                return false;
            }
        },

        remove: function (userId, doc) {
            if(userId === Meteor.settings.admin_user){
                return true;
            } else{
                return false;
            }
        }
    });
}
