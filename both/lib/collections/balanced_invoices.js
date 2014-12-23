Invoices = new Meteor.Collection('invoices');
if (Meteor.isServer) {
    Invoices.deny({
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

    Invoices.allow({
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