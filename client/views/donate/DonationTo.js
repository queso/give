Template.DonationTo.helpers({

	attributes_Input_DonationTo: function () {
	    return {
	        name: "donateTo",
	        id: "donateTo",
	        class: "form-control noBorder",
	        required: true
	    }
	  },
	donateToParam: function () {
    	return $("#donateTo").val(this.params.donateTo);
    },
});

Template.DonationTo.rendered = function () {
	if (Session.get('params.donateTo')) {
		$("#donateTo").val(Session.get('params.donateTo'));
	}
	if (Session.get('params.donateWith')) {
		$("#donateWith").val(Session.get('params.donateWith'));
	}
	if(Session.get('params.donateWith') == 'card') {
		Session.set("paymentMethod", 'card');
	} else {
		Session.set("paymentMethod", 'check');
	}
	if(Session.get('params.recurring') == 'true') {
		$('#recurring').prop('checked', true);
	}
};
