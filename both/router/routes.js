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
    path: '/give',
    data: function() {
      var params = this.params;
      Session.set('params.donateTo', this.params.donateTo);
      Session.set('params.amount', this.params.amount);
      Session.set('params.donateWith', this.params.donateWith);
      Session.set('params.recurring', this.params.recurring);
      return {
        amount: params.amount
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
