function format ( d ) {
    // `d` is the original data object for the row
    return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
        '<tr>'+
            '<td>Full name:</td>'+
            '<td>'+d.name+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Extension number:</td>'+
            '<td>'+d.extn+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Extra info:</td>'+
            '<td>And any further details here (images etc)...</td>'+
        '</tr>'+
    '</table>';
	} 

Template.Transactions.rendered = function () {
	$('.datatable').dataTable( {
		"columnDefs": [
			{ className: "details-control", "targets": [ 0 ] }
		]
	} );

	//order by the date field
	$('#mainTable').dataTable().api().order(2, 'desc').draw();

/*	this.autorun(function(){
		var data = Router.current().data();
		computation(data);
	});*/
};

Template.Transactions.helpers({
	transaction_item: function () {
		return Donate.find({}); //The subscription filters out the records marked viewable: false
	}
});
	
Template.Transactions.events({
	 // Add event listener for opening and closing details
    'click td.details-control': function () {
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
	},
	'click #exportButton': function () {
		$('#mainTable').tableExport({type:'excel',escape:'false', tableName: 'transactions'});
	}
});