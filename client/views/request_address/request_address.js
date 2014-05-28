/*****************************************************************************/
/* RequestAddress: Event Handlers and Helpers */
/*****************************************************************************/
Template.RequestAddress.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.RequestAddress.helpers({
  attributes_Input_FName: function () {
      return {
        type: "text",
        name: "fname",
        class: "form-control",
        value: "John"
      }
    },
    attributes_Input_LName: function () {
      return {
        type: "text",
        name: "lname",
        class: "form-control",
        value: "Doe"
      }
    },
    attributes_Input_AddressLine1: function () {
      return {
        type: "text",
        name: "address_line1",
        class: "form-control",
        value: "Address Line 1",
        placeholder: "address line 1"
      }
    },
    attributes_Input_AddressLine2: function () {
      return {
        type: "text",
        name: "address_line2",
        class: "form-control",
        value: "Address Line 2",
        placeholder: "address line 2"
      }
    },
    attributes_Input_City: function () {
      return {
        type: "text",
        name: "city",
        class: "form-control",
        value: "Topeka",
        placeholder: "city"
      }
    },
    attributes_Input_State: function () {
      return {
        type: "text",
        name: "region",
        class: "form-control",
        value: "KS",
        placeholder: "state / province / region"
      }
    },
    attributes_Input_Zip: function () {
      return {
        type: "text",
        name: "postal_code",
        class: "form-control",
        value: "66618",
        placeholder: "zip or postal code"
      }
    },
    attributes_Select_Country: function () {
      return {
        name: "country",
        class: "form-control",
        value: "US"
      }
    }
});

/*****************************************************************************/
/* RequestAddress: Lifecycle Hooks */
/*****************************************************************************/
Template.RequestAddress.created = function () {
};

Template.RequestAddress.rendered = function () {
};

Template.RequestAddress.destroyed = function () {
};
