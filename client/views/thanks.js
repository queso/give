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
  	}
});

Template.Thanks.rendered = function () {
	// Scroll to top of the parent window
	if (!self == top){
		window.parent.ScrollToTop(); 
	}
};