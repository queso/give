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
        value: "John",
        autofocus: "autofocus",
        "data-parsley-required": true
      }
    },
    attributes_Input_LName: function () {
      return {
        type: "text",
        name: "lname",
        class: "form-control",
        value: "Doe",
        "data-parsley-required": true
      }
    },
    attributes_Input_Email_Address: function () {
      return {
        type: "email",
        name: "email_address",
        class: "form-control",
        value: "josh@trashmountain.com",
        placeholder: "me@myemaildomain.com",
        //'data-parsley-trigger': "change",
        'data-parsley-type': "email",
        "data-parsley-required": true

      }
    },
    attributes_Input_Phone_Number: function () {
      return {
        name: "phone_number",
        class: "form-control",
        value: "785-246-6845",
        placeholder: "785-246-6845",
        'data-parsley-trigger': "change",
        "data-parsley-required": true,
        "data-parsley-pattern": "/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]‌​)\s*)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)([2-9]1[02-9]‌​|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})/"
      }
    },
    attributes_Input_AddressLine1: function () {
      return {
        type: "text",
        name: "address_line1",
        class: "form-control",
        value: "Address Line 1",
        placeholder: "address line 1",
        "data-parsley-required": true
      }
    },
    attributes_Input_AddressLine2: function () {
      return {
        type: "text",
        name: "address_line2",
        class: "form-control",
        value: "Address Line 2",
        placeholder: "address line 2",
        "data-parsley-required": true
      }
    },
    attributes_Input_City: function () {
      return {
        type: "text",
        name: "city",
        class: "form-control",
        value: "Topeka",
        placeholder: "city",
        "data-parsley-required": true
      }
    },
    attributes_Input_Region: function () {
      return {
        type: "text",
        name: "region",
        class: "form-control",
        value: "KS",
        placeholder: "state / province / region",
        "data-parsley-required": true
      }
    },
    attributes_Input_Zip: function () {
      return {
        type: "text",
        name: "postal_code",
        class: "form-control",
        value: "66618",
        placeholder: "zip or postal code",
        "data-parsley-required": true,
        'data-parsley-type': "integer",
        "data-parsley-minlength": "5"
      }
    },
    attributes_Select_Country: function () {
      return {
        name: "country",
        class: "form-control",
        value: "US",
        "data-parsley-required": true
      }
    },
    attributes_Label_FName: function () {
      return {
        class: "control-label",
        for: "fname"
      }
    },
    attributes_Label_LName: function () {
      return {
        class: "control-label",
        for: "lname"
      }
    },
    attributes_Label_Email_Address: function () {
      return {
        class: "col-sm-3 control-label",
        for: "email_address"
      }
    },
    attributes_Label_Phone_Number: function () {
      return {
        class: "col-sm-3 control-label",
        for: "phone_number"
      }
    },
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
