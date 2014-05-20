/*****************************************************************************/
/* DonateIndex: Event Handlers and Helpers */
/*****************************************************************************/
Template.DonateIndex.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.DonateIndex.helpers({
  /*
   * Example: 
   *  items: function () {
   *    return Items.find();
   *  }
   */
});

/*****************************************************************************/
/* DonateIndex: Lifecycle Hooks */
/*****************************************************************************/
Template.DonateIndex.created = function () {
};

Template.DonateIndex.rendered = function () {
  Donate.insert({ created_at : new Date });
};

Template.DonateIndex.destroyed = function () {
};
