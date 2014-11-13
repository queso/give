Template.Report.helpers({
	list: function () {
		return Donate.find(); //The subscription filters out the records marked viewable: false
	}
});

Template.Report.events({
	'click #exportButton': function () {
		$('#mainTable').tableExport({type:'excel',escape:'false', tableName: 'report'});
	}
});