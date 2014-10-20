Template.subscription.events({
	'click .trans-table-row': function (e, tmpl) {
		e.preventDefault();
		Session.set("transaction_guid", this.value.guid);
		Session.set("transaction_amount", this.value.amount);
		Session.set("transaction_date", moment(this.value.updated_at).format("MM-DD-YYYY HH:MM"));
		Session.set("transaction_status", this.value.status);
	}	
});

Template.subscription.helpers({
	subscription: function () {
		return this.recurring.transactions; //The subscription filters out the records marked viewable: false
	},
	fname: function() {
		return this.customer.fname;
	},
	lname: function() {
		return this.customer.lname;
	},
	amount: function() {
		return "$" + (Math.floor(this.value.amount) / 100).toFixed(2);
	},
	subscription_guid: function() {
		return this.recurring.subscriptions.guid;
	},
	trans_guid: function() {
		return this.value.guid;
	},
	values: function() {
		return this;
	},
	status: function() {
		return this.value.status;
	},
	trans_date: function() {
		return moment(this.value.updated_at).format("MM-DD-YYYY HH:MM");
	},
	fund: function(parentContext) {
		return parentContext.debit.donateTo;//getDonateTo();
	}

});

Template.registerHelper('addKeys', function (all) {
    return _.map(all, function(i, k) {
        return {key: k, value: i};
    });
});