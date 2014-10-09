Donate.allow({
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

Donate.deny({
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
