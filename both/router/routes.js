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
      waitOn: function() { //console.log(this.params._id);
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
      waitOn: function() { //console.log(this.params._id);
        return Meteor.subscribe('donate', this.params._id)
      },
      data: function () {
        var params = this.params;
        Session.set('params.print', params.print);
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
  this.route('dashboard', {
    path: ':root/dashboard',
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
    },
    onBeforeAction: function () {
      AccountsEntry.signInRequired(this);
    }
  });
  this.route('transactions', {
    path: ':root/transactions',
    waitOn: function() { //console.log(this.params._id);
        return Meteor.subscribe('donate_list');
    },
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
    },
    action: function () {
        if (this.ready())
            this.render();
        else
            this.render('Loading');
    },
    onBeforeAction: function () {
      AccountsEntry.signInRequired(this);
    }
  });
    this.route('tables', {
    path: ':root/tables',
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
    },
    onBeforeAction: function () {
      AccountsEntry.signInRequired(this);
    }
  });
  this.route('sign-in', {
    path: ':root/sign-in',
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
    }
  });
  this.route('sign-out', {
    path: ':root/sign-out',
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
    }
  });
  this.route('sign-up', {
    path: ':root/sign-up',
    data: function() {
      var params = this.params;
      var root = Meteor.settings.root;
    }
  });
});
