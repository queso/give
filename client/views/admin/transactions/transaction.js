Template.Transaction.helpers({
	name: function () {
		if(this.customer.org){
			return this.customer.org + " " + this.customer.fname + " " + this.customer.lname;
		}else{
			return this.customer.fname + " " + this.customer.lname;
		}
	},
	amount: function () {
		if(this.isRecurring && this.subscriptions){
			return this.subscriptions.amount / 100;
		}else if(this.isRecurring && this.subscription){
			return this.subscription.amount / 100;
		}else if (!this.isRecurring && this.debit && this.debit.amount){
			return this.debit.amount / 100;	
		}
	},
	gift_date: function () {
		return this.created_at
	},
	recurring: function () {
		if(this.isRecurring) {
			return 'Yes';
		}
		else {
			return 'No';
		}
	},
	recurring_subscription_id: function () {
		if(this.isRecurring){
			if(this.subscriptions){
				return this.subscriptions[0].guid;	
			}
		}else{
			return '';
		}
	},
	status: function () {
		if(this.isRecurring) {
			if(this.subscriptions){
				if(this.subscriptions.canceled){
					return "<span id='status' class='label label-default'>Canceled</span>";	
				}else if(!this.subscriptions.canceled){
					return "<span id='status' class='label label-success'>Active</span>";	
				}
			}
		}
		else {
			if(!this.isRecurring && (this.debit.status === 'succeeded')){
				return "<span id='status' class='label label-success'>Succeeded</span>"
			}else if(!this.isRecurring && (this.debit.status === 'pending')){
				return "<span id='status' class='label label-warning'>Pending</span>"
			}else if(!this.isRecurring && (this.debit.status === 'failed')){
				return "<span id='status' class='label label-danger'>Failed</span>"
			}
		}
	},
	detail_record: function () {
		return this._id;		
	},
	stop_recurring: function(e, tmpl) {
		if(this.isRecurring &&  this.subscriptions && !(this.subscriptions.canceled === true)){
			return '<a id="stop' + this._id + '" class="stop_recurring btn btn-warning" href="" title="Stop this recurring donation"><i class="fa fa-stop"></i></a>';
		}
	},
	delete_record: function(e, tmpl) {
		if(!this.isRecurring){
			return '<a id="delete' + this._id + '"class="delete btn btn-danger" href="" title="Stop showing this contribution in our system"><i class="fa fa-trash-o"></i>';
		}
	},
	delete_id: function(e, tmpl) {
		return "delete" + this._id;
	},
	stop_id: function(e, tmpl) {
		return "stop" + this._id;
	},
	root_url: function(e, tmpl) {
		return Meteor.settings.public.root;
	}
});
Template.Transaction.events({
	'click .stop_recurring': function (e, tmpl) {
		e.preventDefault();
		e.stopPropagation();

		var stop_id_is = "stop" + this._id;


		console.log("Started delete process");
		console.log(this._id);

		if(this.isRecurring && this.subscriptions && this.subscriptions.canceled === false ){
			$('#'+stop_id_is).html('<a id="' + stop_id_is + '" class="fa fa-spinner fa-spin" href="">');
			Meteor.call('cancel_recurring', this._id, this.subscriptions.guid, function (error, result) {
				if(result){
					Donate.update({_id: this._id}, {$set:{'subscriptions.canceled': true, viewable: false}});
		            console.warn("Cancelled the subscription and removed this record from view: " + result);
					$('#'+stop_id_is).remove();
					//$('#'+delete_id_is).html('<a id="{{delete_id}}" class="delete btn btn-danger" href="" title="Stop showing this contribution in our system"><i class="fa fa-trash-o"></i>'); 
				} else{
					alert("Couldn't cancel that recurring subscription for some reason, please contact your admin.");
					$('#'+stop_id_is).html('<a id="'+ stop_id_is + '" class="fa fa-exclamation-triangle" title="Cannot find the inforamtion needed to delete this record, contact your admin." href="">');
				}
			});
		} else{
			console.error("Didn't match recurring or one-time, or there was a problem finding the subscription ID");
			//$('#'+delete_id_is).html('<a id="' + stop_id_is + '" class="fa fa-exclamation-triangle" title="Cannot find the inforamtion needed to delete this record, contact your admin." href="">')
			//alert("Cannot find the inforamtion needed to delete this record, contact your admin.");
			Donate.remove(this._id); //TODO: Remove this before production. Also, uncomment line above
		}
	},
	'click #view': function(e, tmpl) {

	},
	'click .delete': function(e, tmpl) {
		var delete_id_is = 'delete' + this._id;
		$('#'+delete_id_is).html('<a id="' + delete_id_is + '" class="fa fa-spinner fa-spin" href="">');
		console.warn("Removed this record from view");
		Donate.update(this._id, { $set: {viewable: false}});
	}
});