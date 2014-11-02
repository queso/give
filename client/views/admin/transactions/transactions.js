Template.Transactions.rendered = function () {
	$('.datatable').dataTable();
	//$('#mainTable').editableTableWidget(); //this needs to run each time the data on the screen changes, otherwise it doesn't work. 
};

Template.Transactions.helpers({
	transaction_item: function () {
		return Donate.find({}); //The subscription filters out the records marked viewable: false
	}
});
	
Template.Transactions.events({
	 // Add event listener for opening and closing details
    'click #mainTable': function () {
    	'td.details-control', function () {
	        var tr = $(this).closest('tr');
	        var row = table.row( tr );
	 
	        if ( row.child.isShown() ) {
	            // This row is already open - close it
	            row.child.hide();
	            tr.removeClass('shown');
	        }
	        else {
	            // Open this row
	            row.child( format(row.data()) ).show();
	            tr.addClass('shown');
	        }
	    }
	}
});