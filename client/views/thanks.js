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