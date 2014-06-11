/*****************************************************************************/
/* DonationWith: Event Handlers and Helpers */
/*****************************************************************************/
Session.set('value', 'Check');

Template.DonationWith.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.DonationWith.helpers({
  values: function () {
    var currentValues = [{value: 'Check', text: "Check"}, {value: 'Card', text: "Card"}];
      return currentValues;
    }
});

/*****************************************************************************/
/* DonationWith: Lifecycle Hooks */
/*****************************************************************************/
Template.DonationWith.created = function () {
};

Template.DonationWith.rendered = function () {
};

Template.DonationWith.destroyed = function () {
};
