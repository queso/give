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
    path: ':root',
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
      Session.set('params.donateTo', this.params.donateTo);
      Session.set('params.amount', this.params.amount);
      Session.set('params.donateWith', this.params.donateWith);
      Session.set('params.recurring', this.params.recurring);
      return {
        amount: params.amount
      }
    }
  });
  this.route('thanks', {
      path: ':root/thanks/:_id',
      waitOn: function() { console.log(this.params._id);
	    return Meteor.subscribe('donate', this.params._id)},
      data: function () {
        var root = Meteor.settings.root;
      return Donate.findOne(this.params._id);
    }});
  this.route('thanks1', {path: ':root//thanks1/:_id',
    waitOn: function() { return Meteor.subscribe('donate', this.params._id)},
    data: function () {
        var root = Meteor.settings.root;
      return Donate.findOne(this.params._id);
    }
  });
  this.route('send.email', {path: ':root//send_email',
  data: function () {
      var root = Meteor.settings.root;
  }});
  this.route('failed', {path: ':root//failed/:_id', data: function () {
      var root = Meteor.settings.root;
  }});
  this.route('charge_existing', {path: ':root//charge_existing', data: function () {
      var root = Meteor.settings.root;
  }});
});
