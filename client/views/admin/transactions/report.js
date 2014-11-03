Template.Report.helpers({
	test_top: function () {
		console.log(this.customer);
		return this.customer; //The subscription filters out the records marked viewable: false
	},
	test_middle: function (parentContext) {
		console.log(parentContext);
		return parentContext.transactions; //The subscription filters out the records marked viewable: false
	},
	transaction_guid: function () {
		console.log(this.guid);
		return this.guid;
	}
});