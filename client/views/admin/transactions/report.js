Template.Report.helpers({
	list: function () {
		return Donate.find(); //The subscription filters out the records marked viewable: false
	},
	transactions: function () {
		var returnThisValue = [];
		this.transactions.forEach(function(entry) {
			if (entry.created_at > Session.get('startDate') && entry.created_at < Session.get('endDate')) {
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
	},
	today: function () {
		return moment().format('D MMMM, YYYY');
	},
	today_minus_30: function () {
		return moment().subtract(30, 'days').format('D MMMM, YYYY');
	}
});

Template.Report.events({
	'click #exportButton': function () {
		$('#mainTable').tableExport({type:'excel',escape:'false', tableName: 'report'});
	}
});

Template.Report.rendered =  function () {
	/*var datepickerStart = '#datepicker-start';
	var datepickerEnd = '#datepicker-end';
	$(datepickerStart).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		dateFormat: "d MM, yy",
		yearRange: '-1:+1'
	}).prev('.btn').on('click', function (e) {
		e && e.preventDefault();
		$(datepickerStart).focus();
	});
	// Now let's align datepicker with the prepend button
	$(datepickerStart).datepicker('widget').css({'margin-left': -$(datepickerStart).prev('.btn').outerWidth()});

	$(datepickerEnd).datepicker({
		showOtherMonths: true,
		selectOtherMonths: true,
		dateFormat: "d MM, yy",
		yearRange: '-1:+1'
	}).prev('.btn').on('click', function (e) {
		e && e.preventDefault();
		$(datepickerEnd).focus();
	});
	// Now let's align datepicker with the prepend button
	$(datepickerEnd).datepicker('widget').css({'margin-left': -$(datepickerEnd).prev('.btn').outerWidth()});*/

	/*$('#reportrange2').daterangepicker(
		{
			ranges: {
				'Today': [moment(), moment()],
				'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
				'Last 7 Days': [moment().subtract('days', 6), moment()],
				'Last 30 Days': [moment().subtract('days', 29), moment()],
				'This Month': [moment().startOf('month'), moment().endOf('month')],
				'Last Month': [moment().subtract('month', 1).startOf('month'), moment().subtract('month', 1).endOf('month')]
			},
			startDate: moment().subtract('days', 29),
			endDate: moment()
		},
		function(start, end) {
			$('#reportrange2 span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
		}
	);*/

}