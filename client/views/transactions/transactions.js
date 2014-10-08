Template.transaction.helpers({
	name: function () {
		if(this.customer.org){
			return this.customer.org + " " + this.customer.fname + " " + this.customer.lname;
		}else{
			return this.customer.fname + " " + this.customer.lname;
		}
	},
	gift_date: function () {
		return this.created_at
	},
	recurring: function () {
		if(this.recurring) {
			return 'Yes';
		}
		else {
			return 'No';
		}
	},
	status: function () {
		if(this.recurring) {
			if(this.recurring.subscription.canceled){
				return "<span class='label label-default'>Canceled</span>";
			}else{
				return "<span class='label label-success'>Active</span>";				
			}
		}
		else {
			if(this.debit.status === 'succeeded'){
				return "<span class='label label-success'>Succeeded</span>"
			}else if(this.debit.status === 'pending'){
				return "<span class='label label-warning'>Pending</span>"
			}else{
				return "<span class='label label-danger'>Failed</span>"
			}
		}
	},
	detail_record: function () {
		return this._id;		
	}
});
Template.transaction.events({
	'click #delete': function () {
		// ...
	}
});

Template.transactions.rendered = function () {
	$('.datatable').dataTable();
	$('#mainTable').editableTableWidget(); //this needs to run each time the data on the screen changes, otherwise it doesn't work. 
};

Template.transactions.helpers({
	transaction_item: function () {
		return Donate.find({});
	}
});
	