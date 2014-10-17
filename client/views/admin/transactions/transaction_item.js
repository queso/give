Template.transactionItem.helpers({
	fname: function() {
		return this.customer.fname;
	},
	lname: function() {
		return this.customer.lname;
	},
	amount: function() {
		return this.debit.amount / 100;
	}
});