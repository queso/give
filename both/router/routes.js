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
    path: '/',
    data: function() {
      return {
        amount: this.params.amount
      }
    }
    });
  this.route('check_form'), {path: '/check_form'};
  this.route('card_form'), {path: '/payWithCard'};
  this.route('card_form'), {path: '/card_form'};
  this.route('receipt', {path: '/receipt'});
  this.route('send.email', {path: '/send_email'});
});
