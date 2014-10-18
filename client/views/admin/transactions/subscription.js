Template.subscription.helpers({
	subscription: function () {
		return Donate.find({}); //The subscription filters out the records marked viewable: false
	},
	fname: function() {
		return this.customer.fname;
	},
	lname: function() {
		return this.customer.lname;
	},
	amount: function() {
		return this.debit.amount / 100;
	},
	subscription_guid: function() {
		return this.recurring.subscriptions.guid;
	}
});