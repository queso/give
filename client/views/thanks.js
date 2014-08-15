Template.Thanks.helpers({
	displayReceipt: function () {
    var statusOfTrans = Donate.findOne(this._id).debit.status;
    if (statusOfTrans === "pending") {
      Session.set("status", 'pending');
    } else if (statusOfTrans === "succeeded") {
      Session.set("status", 'succeeded');
      return true;
    } else if (statusOfTrans === "failed") {
      Session.set("status", 'failed');
      return false;  
    }
  },
  successOrPendingPayment: function () {
    if(Session.equals('status', 'succeeded')) {
      return true;
    } else if (Session.equals('status', 'pending')) {
      return true; 
    }
    else{ 
      return false;
    }
  },
	successOrPendingTrans: function () {
  	return "<h3 class='text-center'>Thank you for your gift!</h3>\
                <p class='alert alert-info'>\
                    You will receive an email acknowledgement immediately and an email receipt after your gift has been successfully processed.\
                    This page will automatically show your gift receipt once the payment has been approved. <strong>For ACH gifts it may take up to a \
                    few days to receive an email receipt.</strong> \
                  </p>\
  			<p class='text-center alert alert-success'>\
  				<i class='fa fa-check-square'></i>\
  			</p>";
  },
  failedTrans: function () {
    var referrer = Donate.findOne(this).URL;
    return "<h3 class='text-center badText'>Something went wrong.</h3>\
          <p class='text-center alert alert-error'>\
            We weren't able to process your gift. Please <a href='" + referrer + "'>go back</a> and try again.\
            <br>\
            <a href='" + referrer + "'><i class='fa fa-arrow-left'></i></a>\
          </p>";
  }
});

Template.Thanks.rendered = function () {
  var setStatus = Donate.findOne(this).debit.status;
  Session.set('status', setStatus);
};