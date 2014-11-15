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

Meteor.publish('give_report', function (start_date, finish_date) {

	//check to see that the user is the admin user
	if(this.userId === Meteor.settings.admin_user){
		start_date.moment(Date.parse(start_date)).format('YYYY-MM-DD').slice(0,10);
		finish_date.moment(Date.parse(finish_date)).format('YYYY-MM-DD').slice(0,10);

		return Donate.find( { 'transactions.created_at' : { $gte: start_date, $lt : finish_date } }, { 'transactions' : true } );

		//this should go on the client side
		/*test.forEach(function(entry) {
		 console.log(entry._id);
		 entry.transactions.forEach(function(entry) {
		 entry.created_at > '2014-11-01T06:00:00.000Z' && entry.created_at < '2014-11-05T05:59:59.000Z' ? console.log(entry) : console.log('');
		 });
		 });*/
	}else{
		return '';
	}



});

//Still searching for the appropriate way to return the embedded dates in a range
/*
Meteor.publish('filter_date', function (date) {
	if(this.userId === Meteor.settings.admin_user) {
		return Donate.find({created_at: date});
	} else {
		return '';
	}
});*/
