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
        amount: this.params.amount
      }
    }
    });
  this.route('card_form', {
    path: '/card_form',
    data: function() {
      return {
        amount: this.params.amount
      }
    }
    });
  this.route('receipt', {path: '/receipt/:_id', 
    waitOn: function() { return Meteor.subscribe('donate', this.params._id)},
    data: function () {return Donate.findOne(this.params._id);}
    });
  this.route('send.email', {path: '/send_email'});
});
