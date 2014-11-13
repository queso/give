/*****************************************************************************/
/* DonateIndex Publish Functions
/*****************************************************************************/

Meteor.publish('donate', function (input) {
	 return Donate.find({_id: input});
});

Meteor.publish('donate_list', function () {
	//check to see that the user is the admin user
	 if(this.userId === Meteor.settings.admin_user){
	 	return Donate.find({viewable: true});
	 }else{
	 	return '';
	 }
});

//Still searching for the appropriate to return the embedded dates in a range
/*
Meteor.publish('filter_date', function (date) {
	if(this.userId === Meteor.settings.admin_user) {
		return Donate.find({created_at: date});
	} else {
		return '';
	}
});*/
