/*****************************************************************************/
/* RequestAddress: Event Handlers and Helpers */
/*****************************************************************************/
Template.RequestAddress.events({

   'change #country': function(e, tmpl) {
    var countryValue;
    if($('#country').val() !== "US") {
      console.log("Value of country " + $('#country').val());
      $('#phone').hide().find('input, textarea').prop('disabled', true);
      $('#phone, text').val("");
      $('#phoneDiv').hide().find('input, textarea').prop('disabled', true);
    } else {
      console.log("In else");
      $('#phoneDiv').show().find('input, textarea').prop('disabled', false);
      $('#phone').show().find('input, textarea').prop('disabled', false);
    }
   }
});

Template.RequestAddress.helpers({
  attributes_Input_FName: function () {
      return {
        type: "text",
        name: "fname",
        id: 'fname',
        class: "form-control",
        placeholder: "First Name",
        required: true
      }
    },
    attributes_Input_LName: function () {
      return {
        type: "text",
        name: "lname",
        id: "lname",
        class: "form-control",
        placeholder: "Last Name",
        required: true
      }
    },
    attributes_Input_Email_Address: function () {
      return {
        type: "email",
        name: "email_address",
          id: "email_address",
        class: "form-control email",
        placeholder: "Email address",
        required: true
      }
    },
    attributes_Input_Phone_Number: function () {
      return {
        class: "form-control",
        placeholder: "Phone Number",
        required: true,
        type: "tel",
        id: "phone"
      }
    },
    attributes_Input_AddressLine1: function () {
      return {
        type: "text",
        name: "address_line1",
          id: "address_line1",
        class: "form-control",
        placeholder: "address line 1",
        required: true
      }
    },
    attributes_Input_AddressLine2: function () {
      return {
        type: "text",
        name: "address_line2",
          id: "address_line2",
        class: "form-control",
        placeholder: "address line 2"
      }
    },
    attributes_Input_City: function () {
      return {
        type: "text",
        name: "city",
          id: "city",
        class: "form-control",
        placeholder: "city",
        required: true
      }
    },
    attributes_Input_State: function () {
      return {
        type: "text",
        name: "region",
        id: "region",
        class: "form-control text-capitalize",
        placeholder: "State",
        required: true
      }
    },
    attributes_Input_Zip: function () {
      return {
        type: "text",
        name: "postal_code",
          id: "postal_code",
        class: "form-control",
        placeholder: "zip or postal code",
        required: true
      }
    },
    attributes_Select_Country: function () {
      return {
        name: "country",
          id: "country",
        class: "form-control",
        required: true
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
