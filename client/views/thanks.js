Template.Thanks.helpers({
	displayReceipt: function () {

		console.log(Donate.findOne(this._id).debit.status);
			if (Donate.findOne(this._id).debit.status === "succeeded") {
				console.log("inside displayReceipt function");
				return true;
			}
		return false;
	}
});

Template.Thanks.rendered = function () {
	// Scroll to top of the parent window
	if (window.parent){
		window.parent.ScrollToTop(); 
	}
};