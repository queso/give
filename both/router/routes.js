/*****************************************************************************/
/* Client and Server Routes */
/*****************************************************************************/
Router.configure({
  layoutTemplate: 'MasterLayout',
  loadingTemplate: 'Loading',
  notFoundTemplate: 'NotFound',
  templateNameConverter: 'upperCamelCase',
  routeControllerNameConverter: 'upperCamelCase'
});

Router.map(function () {
  /*
    Example:
      this.route('home', {path: '/'});
  */
    this.route('check_form', {
    path: '/check_form',
    data: function() {
      return {
        amount: this.params.amount,
        donation_to: this.params.donation_to
      }
    }
    });
  this.route('card_form', {
    path: '/card_form',
    data: function() {
      return {
        amount: this.params.amount,
        donation_to: this.params.donation_to
      }
    }
    });
  this.route('receipt', {path: '/receipt/:_id', 
    waitOn: function() { return Meteor.subscribe('donate', this.params._id)},
    data: function () {
      console.log(moment(Donate.findOne(this.params._id).email_sent).format('HH:MM, MM/DD/YYYY'));
      if (!Donate.findOne(this.params._id).email_sent) {
        var sendToEmail = {};
        sendToEmail.email =  Donate.findOne(this.params._id).email_address;
        sendToEmail.donateTo =  Donate.findOne(this.params._id).donateTo;
        sendToEmail.total_amount =  Donate.findOne(this.params._id).total_amount;
        sendToEmail.id = Donate.findOne(this.params._id)._id;
        console.log(sendToEmail);
        Meteor.call("sendEmailOutAPI", sendToEmail, function() {
        });
        Donate.update(sendToEmail.id, {$set: {
            email_sent: new Date().getTime()
      }});
    } 
        return Donate.findOne(this.params._id);}
      });
  this.route('send.email', {path: '/send_email'});
  this.route('failed', {path: '/failed/:_id'});
});
