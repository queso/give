//Includes relevant guid or id, time_sent, sent?, template_name, sent_to
Audit_trail = new Meteor.Collection('audit_trail');
if (Meteor.isServer) {
    Audit_trail.deny({
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

    Audit_trail.allow({
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