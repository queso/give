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
  
  this.route('donation_form', {
    path: '/donation_form',
    data: function() {
      return {
        amount: this.params.amount,
        donation_to: this.params.donation_to,
        donation_with: this.params.donation_with
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
