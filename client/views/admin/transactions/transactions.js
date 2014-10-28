Template.transactions.rendered = function () {
	$('.datatable').dataTable();
	//$('#mainTable').editableTableWidget(); //this needs to run each time the data on the screen changes, otherwise it doesn't work. 
};

Template.transactions.helpers({
	transaction_item: function () {
		return Donate.find({}); //The subscription filters out the records marked viewable: false
	}
});
	