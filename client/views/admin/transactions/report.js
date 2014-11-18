Template.Report.helpers({
	list: function () {
		return Donate.find(); //The subscription filters out the records marked viewable: false
	},
	transactions: function () {
		var returnThisValue = [];
		this.transactions.forEach(function(entry) {
			if (entry.created_at > Session.get('startDate') && entry.created_at < Session.get('endDate')) {
				returnThisValue.push(entry);
			}
		});
		return returnThisValue;
	},
	start_date: function () {
		return moment(Session.get('startDate')).format('MMM D, YYYY');
	},
	end_date: function () {
		return moment(Session.get('endDate')).format('MMM D, YYYY');
	}
});

Template.Report.events({
	'click #exportButton': function () {
		$('#mainTable').tableExport({type:'excel',escape:'false', tableName: 'report'});
	}
});

Template.Report.rendered = function () {
	$('#reportrange').daterangepicker(
		{
			ranges: {
				'Today': [moment(), moment()],
				'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
				'Last 7 Days': [moment().subtract('days', 6), moment()],
				'Last 30 Days': [moment().subtract('days', 29), moment()],
				'This Month': [moment().startOf('month'), moment().endOf('month')],
				'Last Month': [moment().subtract('month', 1).startOf('month'), moment().subtract('month', 1).endOf('month')]
			},
			startDate: moment(Session.get('startDate')).format('MM/DD/YYYY'),
			endDate: moment(Session.get('endDate')).format('MM/DD/YYYY')
		},
		function(start, end) {
			$('#reportrange span').html(start.format('MMM D, YYYY') + ' - ' + end.format('MMM D, YYYY'));
			Session.set('startDate', start.format('YYYY-MM-DD'));
			Session.set('endDate', end.format('YYYY-MM-DD'));
			Router.go('/give/report?startDate=' + start.format('YYYY-MM-DD') + '&endDate=' + end.format('YYYY-MM-DD') );
		}
	);
};