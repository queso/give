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
      //this is the route for one-time gift acknowledgements
      path: ':root/thanks/:_id',
      waitOn: function() { console.log(this.params._id);
	    return Meteor.subscribe('donate', this.params._id)},
      data: function () {
        var root = Meteor.settings.root;
      return Donate.findOne(this.params._id);
          },
      action: function () {
          if (this.ready())
              this.render();
          else
              this.render('Loading');
      }
  });
  this.route('gift', {
    //this is the route for recurring gift acknowledgements
      path: ':root/gift/:_id',
      waitOn: function() { console.log(this.params._id);
      return Meteor.subscribe('donate', this.params._id)},
      data: function () {
        var root = Meteor.settings.root;
        Session.set('params.transaction_guid', this.params.transaction_guid);
      return Donate.findOne(this.params._id);
          },
      action: function () {
          if (this.ready())
              this.render();
          else
              this.render('Loading');
      }
  });
});
