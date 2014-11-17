Template.Report.helpers({
	list: function () {
		return Donate.find(); //The subscription filters out the records marked viewable: false
	},
	transactions: function () {
		var returnThisValue = [];
		this.transactions.forEach(function(entry) {
			if (entry.created_at > '2014-11-16T16:43:18.414627+00:00' && entry.created_at < '2014-11-17T17:43:18.414627+00:00') {
				console.log(entry);
				returnThisValue.push(entry);
			}
		});
		return returnThisValue;
		//var transactions = this;
		/*return this.forEach(function(entry) {
			entry.transactions.forEach(function(entry) {
				entry.created_at > '2014-11-10T16:43:18.414627+00:00' && entry.created_at < '2014-11-17T17:43:18.414627+00:00' ? console.log(entry) : console.log('');
			});
		});*/
	},
	individuals: function () {
		if(this.created_at > '2014-11-10T16:43:18.414627+00:00' && this.created_at < '2014-11-17T17:43:18.414627+00:00') {
			return this;
		} else {
			return '';
		}
	}
});

Template.Report.events({
	'click #exportButton': function () {
		$('#mainTable').tableExport({type:'excel',escape:'false', tableName: 'report'});
	}
});