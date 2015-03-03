Template.Thanks.rendered = function() {
    // Turn it off - remove the function entirely
    window.onbeforeunload = null;
};
Template.Thanks.helpers({
	displayReceipt: function () {
        var debitStatus = Debits.findOne().status;
        return (debitStatus === 'succeeded');
    },
	successOrPendingPayment: function () {
        var debitStatus = Debits.findOne().status;
        return (debitStatus === 'succeeded' || debitStatus === 'pending');
    },
	successOrPendingTrans: function () {
        return "<h3 class='text-center'>Thank you for your gift!</h3>\
                    <p class='alert alert-info'>\
                        You will receive an email acknowledgement immediately and an email receipt after your gift has been successfully processed.\
                        This page will automatically show your gift receipt once the payment has been approved. <strong>For ACH gifts it may take up to a \
                        four days to receive an email receipt.</strong> \
                      </p>\
                <p  id='success_pending_icon' class='text-center alert alert-success'>\
                    <i class='fa fa-check-square large-check'></i>\
                </p>";
    },
    failedTrans: function () {
        var referrer = Donations.findOne().URL;
        var errorMessage = Debits.findOne().failure_reason ? Debits.findOne().failure_reason + " " + Debits.findOne().failure_reason_code : 'The error we got from the card \
        processor was not very helpful so instead of displaying their cryptic error message you got this message, sorry we could not be more helpful.';
        if(!referrer || !errorMessage) {
          return "<h3 class='text-center badText'>Something went wrong.</h3>\
              <p class='text-center alert alert-error'>\
                We weren't able to process your gift. <a href='https://trashmountain.com/donate'>go back</a> and try again.\
                <br>\
                <a id='failed_icon' href='https://trashmountain.com/donate'><i class='fa fa-arrow-left large-arrow'></i></a>\
              </p>";
        }
        return "<h3 class='text-center badText'>Something went wrong.</h3>\
              <p class='text-center alert alert-error'>\
                We weren't able to process your gift. Here is the error: <br><strong>" + errorMessage + "</strong><br> Please <a href='" + referrer + "'>go back</a> and try again.\
                <br>\
                <a id='failed_icon' href='" + referrer + "'><i class='fa fa-arrow-left large-arrow'></i></a>\
              </p>";
    }
});