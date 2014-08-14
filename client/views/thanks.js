Template.Thanks.helpers({
	displayReceipt: function () {
 
 		console.log(Donate.findOne(this._id).debit.status);
 			if (Donate.findOne(this._id).debit.status === "succeeded") {
 				console.log("inside displayReceipt function");
 				return true;
 			}
 		return false;
 	},
  	paymentWithCard: function () {
    	return Session.equals("paymentMethod", "card");
  	},
  	statusOfTrans: function () {
  		console.log(this);
  		var referrer = Donate.findOne(this).URL;
  		if (Donate.findOne(this._id).debit.status === "succeeded") {
        	return "<h3 class='text-center'>Thank you for your gift!</h3>\
        			<p class='text-center alert alert-success'>\
        				<i class='fa fa-check-square'></i>\
        			</p>"
      	} else {
      		return "<h3 class='text-center badText'>Something went wrong.</h3>\
        			<p class='text-center alert alert-error'>\
        				We weren't able to process your gift. Please <a href='" + referrer + "'>go back</a> and try again.\
        			</p>";
      	}

  	}
});

Template.Thanks.rendered = function () {
	var referrer =  document.referrer;
	console.log(referrer);
};