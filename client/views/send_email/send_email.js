/*****************************************************************************/
/* SendEmail: Event Handlers and Helpers */
/*****************************************************************************/
Template.SendEmail.events({
  'submit form': function (e, tmpl) {
    e.preventDefault();
     var emailData = {
      email:         $(e.target).find('[name=email_address]').val(),
      donateTo:  $(e.target).find('[name=DonateTo]').val(),
      amount:     $(e.target).find('[name=amount]').val()
    }
    console.log(emailData);
    Meteor.call('sendEmailOutAPI', emailData, function (error, result) {
      console.log(result);
      console.log(error);
    });
  }
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.SendEmail.helpers({
  /*
   * Example: 
   *  items: function () {
   *    return Items.find();
   *  }
   */
});

/*****************************************************************************/
/* SendEmail: Lifecycle Hooks */
/*****************************************************************************/
Template.SendEmail.created = function () {
};

Template.SendEmail.rendered = function () {
};

Template.SendEmail.destroyed = function () {
};
