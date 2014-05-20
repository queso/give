/*****************************************************************************/
/* TotalDonation: Event Handlers and Helpers */
/*****************************************************************************/
Template.TotalDonation.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.TotalDonation.helpers({
  attributes_Input_Total_Amount: function () {
        return {
            type: "number",
            name: "total_amount",
            id: "total_amount",
            class: "form-control",
            readonly: true
        }
    },
  attributes_Label_Total_Amount: function () {
      return {
          class: "col-sm-3 control-label",
          for: "total_amount"
      }
  }
});

/*****************************************************************************/
/* TotalDonation: Lifecycle Hooks */
/*****************************************************************************/
Template.TotalDonation.created = function () {
};

/*Template.TotalDonation.rendered = function (e, tmpl) {
  var total = tmpl.find('form.total_amount');
  total.prop('readonly', true);
};*/

Template.TotalDonation.destroyed = function () {
};
