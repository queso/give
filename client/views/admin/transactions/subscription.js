Template.Subscription.events({
	'click .trans-table-row': function (e, tmpl) {
		e.preventDefault();
		Session.set("transaction_guid", this.guid);
		Session.set("transaction_amount", this.amount);
		Session.set("transaction_date", moment(this.updated_at).format("MM-DD-YYYY hh:mma"));
		Session.set("transaction_status", this.status);
		$('.transaction_details').show(300).fadeIn();
	}	
});

Template.Subscription.helpers({
	transaction: function () {
		return this.transactions; //The subscription filters out the records marked viewable: false
	},
	fname: function() {
		return this.customer.fname;
	},
	lname: function() {
		return this.customer.lname;
	},
	amount: function() {
		return "$" + (this.amount /100).toFixed(2);
	},
	subscription_guid: function() {
		return this.guid;
	},	
	trans_guid: function() {
		return this.guid;
	},
	values: function() {
		return this;
	},
	status: function() {
		return this.status;
	},
	trans_date: function() {
		return moment(this.updated_at).format("MM-DD-YYYY hh:mma");
	},
	fund: function(parentContext) {
		return parentContext.debit.donateTo;//getDonateTo();
	}

});

/*
Template.registerHelper('addKeys', function (all) {
    return _.map(all, function(i, k) {
        return {key: k, value: i};
    });
});
//return _.chain(all).map(function(i, k) { return {key: k, value: i}; }).filter(all, function(obj){ if(obj.i === "2014-10-05T11:15:56.710351+00:00") return true; }).value();
//TODO: would like to be able to chain underscore to use in displaying a set time frame
*/