/*****************************************************************************/
/* DonateIndex Publish Functions
/*****************************************************************************/

Meteor.publish('receipt_donations', function (input) {
	//Check the input that came from the client
	check(input, String);
	return Donations.find({_id: input}, {fields: {
		sessionId: 0,
		viewable: 0,
		created_at: 0,
		order: 0
	}});
});

Meteor.publish('receipt_customers', function (input) {
	//Check the input that came from the client
	check(input, String);
	return Customers.find({_id: input}, {fields: {'id': 0}});
    /*, {fields: {
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
    }}*/
});

Meteor.publish('receipt_charges', function (input) {
	//Check the input that came from the client
	check(input, String);

	return Charges.find({_id: input}, {fields: {'id': 0}});
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
	//Check the input that came from the client
	check(start_date, String);
	check(finish_date, String);

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
	if (this.userId) {
        var donations = Meteor.users.findOne({_id: this.userId}).donations;
        return Donations.find({'_id': { $in: donations}});
	} else {
		this.ready();
	}
});

Meteor.publish("userDebits", function () {
	if (this.userId) {
        var debits = Meteor.users.findOne({_id: this.userId}).debits;
		return Debits.find({'_id': { $in: debits}});
	} else {
		this.ready();
	}
});

Meteor.publish("userCustomers", function () {
	if (this.userId) {
        var customers = Meteor.users.findOne({_id: this.userId}).primary_customer_id;
        console.log(customers);
		return Customers.find(customers);
	} else {
		this.ready();
	}
});

Meteor.publish("userDT", function (page) {
	if (this.userId) {
        var persona_ids = Meteor.users.findOne({_id: this.userId}).persona_id;
        console.log(persona_ids);
		return DT_donations.find( { persona_id: { $in: persona_ids } } );
	} else {
		this.ready();
	}
});

Meteor.publish("userDTFunds", function () {
    if (this.userId) {
        return DT_funds.find();
    } else {
        this.ready();
    }
});



/*
Meteor.publish("userGivingFocus", function () {
	//var donation_ids = Meteor.users.findOne({_id: this.userId}).donations;
	//var donations = Donations.find({'_id': { $in: donation_ids}});
	var sub = this;
	var pipeline = ([{$group : {  _id: '$donateTo', total : {$sum : "$total_amount"}, count: { $sum: 1 }}},
		{$sort: {total: -1}},
		{$project : { '_id' : 0, 'donateTo' : '$_id', 'total' : '$total', 'count' : '$count'}},
		{$limit: 1} ]);

	var result = Donations.aggregate(pipeline);
	console.dir(result);

	*/
/*self = this;
	var aggregated_donations = Donations.aggregate([
		{$group : {  _id: this.donateTo, total : {$sum : "$total_amount"}, count: { $sum: 1 }}},
		{$sort: {total: -1}},
		{$project : { '_id' : 0, 'donateTo' : '$_id', 'total' : '$total', 'count' : '$count'}},
		{$limit: 1} ]).result[0]
	console.dir(aggregated_donations);*//*

	if (this.userId) {
		var giving_id = Client_collection_giving.insert({donateTo: result[0].donateTo, total: result[0].total, count: result[0].count });
		return Client_collection_giving.find(giving_id);
	} else {
		this.ready();
	}
});*/
