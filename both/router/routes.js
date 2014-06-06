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
  this.route('thanks', {path: '/thanks/:_id', 
    waitOn: function() { return Meteor.subscribe('donate', this.params._id)},
    data: function () {
      return Donate.findOne(this.params._id);
    }
  });
  this.route('send.email', {path: '/send_email'});
  this.route('failed', {path: '/failed/:_id'});
  this.route('charge_existing', {path: '/charge_existing'});
});
