/*****************************************************************************/
/* Client and Server Routes */
/*****************************************************************************/
Router.onRun(function(){
    if(Session.equals('AnalyticsJS_loaded', true))
        analytics.page(this.path);
});
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
  this.route('thanks', {path: '/give/thanks/:_id', 
    waitOn: function() { return Meteor.subscribe('donate', this.params._id)},
    data: function () {
      return Donate.findOne(this.params._id);
    }    
  });
  this.route('thanks1', {path: '/give/thanks1/:_id', 
    waitOn: function() { return Meteor.subscribe('donate', this.params._id)},
    data: function () {
      return Donate.findOne(this.params._id);
    }
  });
  this.route('send.email', {path: '/give/send_email'});
  this.route('failed', {path: '/give/failed/:_id'});
  this.route('charge_existing', {path: '/give/charge_existing'});
});
