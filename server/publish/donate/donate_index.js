/*****************************************************************************/
/* DonateIndex Publish Functions
/*****************************************************************************/

Meteor.publish('receipt_donations', function (input) {
	return Donations.find({_id: input}, {fields: {
		sessionId: 0,
		viewable: 0,
		created_at: 0,
		URL: 0,
		order: 0
	}});
});

Meteor.publish('receipt_customers', function (input) {
	return Customers.find({_id: input}, {fields: {
		'links.source': 1,
		'name': 1,
		'address': 1,
		'phone': 1,
		'email': 1,
		'id': 1,
		'business_name': 1,
		'cards.id': 1,
		'cards.links.customer': 1,
		'cards.number': 1,
		'cards.brand': 1,
		'bank_accounts.id': 1,
		'bank_accounts.links.customer': 1,
		'bank_accounts.account_number': 1,
		'bank_accounts.bank_name': 1,
		'bank_accounts.account_type': 1
	}});
});

Meteor.publish('receipt_debits', function (input) {
	return Debits.find({_id: input}, {fields: {
		'status': 1,
		'links.source': 1,
		'id': 1
	}});
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
		start_date = moment(Date.parse(start_date)).format('YYYY-MM-DD').slice(0,10);
		finish_date = moment(Date.parse(finish_date)).format('YYYY-MM-DD').slice(0,10);

		return Donate.find( { 'transactions.created_at' : { $gte: start_date, $lte : finish_date } }, { 'transactions' : true } );

	}else{
		return '';
	}

});

Meteor.publish('card_expiring', function () {
	//check to see that the user is the admin user
	if(this.userId === Meteor.settings.admin_user){
		var today = new Date();
		var future_date = new Date(new Date(today).setMonth(today.getMonth()+3));
		return Donate.find( { $and : [ {'card.expires' : {$lte : future_date }}, { isRecurring: true}] }, { card : true } );
	}else{
		return '';
	}
});

Meteor.publish("userDataPublish", function () {
	if (this.userId) {
		return Meteor.users.find({_id: this.userId});
	} else {
		this.ready();
	}
});

Meteor.publish("userDonations", function () {
	var donations = Meteor.users.findOne({_id: this.userId}).donations;

	if (this.userId) {
		return Donations.find({'_id': { $in: donations}});
	} else {
		this.ready();
	}
});

Meteor.publish("userDebits", function () {
	var debits = Meteor.users.findOne({_id: this.userId}).debits;

	if (this.userId) {
		return Debits.find({'_id': { $in: debits}});
	} else {
		this.ready();
	}
});

Meteor.publish("userCustomers", function () {
	var customers = Meteor.users.findOne({_id: this.userId}).primary_customer_id;
	console.log(customers);
	if (this.userId) {
		return Customers.find(customers);
	} else {
		this.ready();
	}
});
