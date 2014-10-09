function adminUser(userId) {
    var adminUser = Meteor.users.findOne({email:"josh@trashmountain.com"});
    return (userId && adminUser && userId === adminUser._id)
;}

//update today's topics
Meteor.methods({
  cancel_recurring: function(id) {
    if (!Meteor.settings.admin_user === this.userId) {
      throw new Meteor.Error(403, "You must be an admin to do that");

    }else{
		Donate.update({_id: id}, {$set:{viewable: false}});
    }
    
  }
});