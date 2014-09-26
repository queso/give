Template.Thanks.helpers({
	displayReceipt: function () {
        var debitStatus = this.debit.status;
    return (debitStatus === 'succeeded');
  },
	successOrPendingPayment: function () {
        var debitStatus = this.debit.status;
      return (debitStatus === 'succeeded' || debitStatus === 'pending');
  },
	successOrPendingTrans: function () {
  	return "<h3 class='text-center'>Thank you for your gift!</h3>\
                <p class='alert alert-info'>\
                    You will receive an email acknowledgement immediately and an email receipt after your gift has been successfully processed.\
                    This page will automatically show your gift receipt once the payment has been approved. <strong>For ACH gifts it may take up to a \
                    few days to receive an email receipt.</strong> \
                  </p>\
  			<p  id='success_pending_icon' class='text-center alert alert-success'>\
  				<i class='fa fa-check-square'></i>\
  			</p>";
  },
  failedTrans: function () {
    var referrer = this.URL;
    var errorMessage = this.failed.failure_reason + " " + this.failed.failure_reason_code;
    if(!referrer || !errorMessage) {
      return;
    }
    return "<h3 class='text-center badText'>Something went wrong.</h3>\
          <p class='text-center alert alert-error'>\
            We weren't able to process your gift. Here is the error: </br><strong>" + errorMessage + "</strong></br> Please <a href='" + referrer + "'>go back</a> and try again.\
            <br>\
            <a id='failed_icon' href='" + referrer + "'><i class='fa fa-arrow-left'></i></a>\
          </p>";
  }
});

Template.Gift.helpers({
  displayReceipt: function () {
    var transaction_guid = Session.get('params.transaction_guid');
    var transaction_status = this.recurring.transactions[transaction_guid].status;
    return (transaction_status === 'succeeded');
  },
  successOrPendingPayment: function () {
        var debitStatus = this.debit.status;
      return (debitStatus === 'succeeded' || debitStatus === 'pending');
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
    var referrer = this.URL;
    var errorMessage = this.failed.failure_reason + " " + this.failed.failure_reason_code;
    if(!referrer || !errorMessage) {
      return;
    }
    return "<h3 class='text-center badText'>Something went wrong.</h3>\
          <p class='text-center alert alert-error'>\
            We weren't able to process your gift. Here is the error: </br><strong>" + errorMessage + "</strong></br> Please <a href='" + referrer + "'>go back</a> and try again.\
            <br>\
            <a href='" + referrer + "'><i class='fa fa-arrow-left'></i></a>\
          </p>";
  }
});