Template.Report.helpers({
	list: function () {
		return Donate.find(); //The subscription filters out the records marked viewable: false
	}
});