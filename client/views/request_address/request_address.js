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
   'change [name=country]': function(e, tmpl) {
    if($(e.target).find('[name=country]').val() !== "US") {
      console.log("Value of country " + $('[name=country]').val());
      $('#phone').hide().find('input, textarea').prop('disabled', true);
      $('#phone, text').val("");
      $('#phoneDiv').hide().find('input, textarea').prop('disabled', true);
    }
   }

});

Template.RequestAddress.helpers({
  attributes_Input_FName: function () {
      return {
        type: "text",
        name: "fname",
        class: "form-control",
        value: "John",
        autofocus: "autofocus",
        required: true
      }
    },
    attributes_Input_LName: function () {
      return {
        type: "text",
        name: "lname",
        class: "form-control",
        value: "Doe",
        required: true
      }
    },
    attributes_Input_Email_Address: function () {
      return {
        type: "email",
        name: "email_address",
        class: "form-control",
        value: "josh@trashmountain.com",
        placeholder: "me@myemaildomain.com",
        required: true

      }
    },
    attributes_Input_Phone_Number: function () {
      return {
        name: "phone_number",
        class: "form-control",
        value: "785-246-6845",
        placeholder: "785-246-6845",
        required: true,
        type: "tel",
        id: "phone"
      }
    },
    attributes_Input_AddressLine1: function () {
      return {
        type: "text",
        name: "address_line1",
        class: "form-control",
        value: "Address Line 1",
        placeholder: "address line 1",
        required: true
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
        placeholder: "city",
        required: true
      }
    },
    attributes_Input_State: function () {
      return {
        type: "text",
        name: "region",
        id: "region",
        class: "form-control text-uppercase",
        value: "KS",
        placeholder: "State",
        required: true
      }
    },
    attributes_Input_Zip: function () {
      return {
        type: "text",
        name: "postal_code",
        class: "form-control",
        value: "66618",
        placeholder: "zip or postal code",
        required: true
      }
    },
    attributes_Select_Country: function () {
      return {
        name: "country",
        class: "form-control",
        value: "US",
        required: true
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
    }
});

/*****************************************************************************/
/* RequestAddress: Lifecycle Hooks */
/*****************************************************************************/
Template.RequestAddress.created = function () {
};

Template.RequestAddress.rendered = function () {
 $("#phone").mask("(999) 999-9999");    
};

Template.RequestAddress.destroyed = function () {
};
