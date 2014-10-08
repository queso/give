/*****************************************************************************/
/* DonateIndex Publish Functions
/*****************************************************************************/

Meteor.publish('donate', function (input) {
	 return Donate.find({_id: input});
});

Meteor.publish('donate_list', function () {
	 return Donate.find();
});