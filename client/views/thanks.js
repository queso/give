Template.Thanks.helpers({
	emailSent: function () {
		if (Donate.findOne(this._id).email_sent) {
			return true;
		}
		return false;
	}
});