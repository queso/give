Template.Thanks.helpers({
	emailSent: function () {
		if (Donate.findOne(this._id).debit.status === "succeeded") {
			return true;
		}
		return false;
	}
});