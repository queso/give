/*****************************************************************************/
/* DonationForm: Event Handlers and Helpers */
/*****************************************************************************/
function updateTotal(data){
  if ($('#coverTheFees').prop('checked')) {
        var donationAmount = $('#amount').val();
        var roundedAmount = Math.round(donationAmount * 1.029 + .30);
        return $("#total_amount").val(roundedAmount);
      }
      else {
        return $("#total_amount").val($('#amount').val());
      }
}

Template.DonationForm.events({
  'submit form': function (e, tmpl) {

    e.preventDefault();
    /*Session.equals('status', 'Started donation process.');

    Deps.autorun(function(){
    Session.get("status");
      notif({
        msg: "<b>" + Session.get('status') + "</b>",
        type: "success",
        position: "center"
      });
});*/

    //Start the bootstrap modal with the awesome font refresh logo
    //Also, backdrop: 'static' sets the modal to not be exited when 
    //a user clicks in the background.
    $('#loading1').modal({
      visibility: 'show',
      backdrop: 'static'});

    //Scroll to the top of the window after form is submitted.
    $('html, body').animate({ scrollTop: 0 }, 'fast');

    
    var recurringStatus =     $(e.target).find('[name=is_recurring]').is(':checked');
    var coverTheFeesStatus =  $(e.target).find('[name=coverTheFees]').is(':checked');
    var form = {
      "paymentInformation": [{
      "amount":         $(e.target).find('[name=amount]').val(),
      "total_amount":   $(e.target).find('[name=total_amount]').val(),
      "donateTo":       $( "#donateTo" ).val(),
      "donateWith":     $("#donateWith").val(),
      "recurring":      { is_recurring: recurringStatus },
      "created_at":     new Date().getTime(),
      }],
        "customer": [{
        "fname":          $(e.target).find('[name=fname]').val(),
        "lname":          $(e.target).find('[name=lname]').val(),
        "email_address":  $(e.target).find('[name=email_address]').val(),
        "phone_number":   $(e.target).find('[name=phone_number]').val(),
        "address_line1":  $(e.target).find('[name=address_line1]').val(),
        "address_line2":  $(e.target).find('[name=address_line2]').val(),
        "region":         $(e.target).find('[name=region]').val(),
        "city":           $(e.target).find('[name=city]').val(),
        "postal_code":    $(e.target).find('[name=postal_code]').val(),
        "country":        $(e.target).find('[name=country]').val(),
        "created_at":     new Date().getTime()
      }]
    };
console.log(form.paymentInformation[0].donateTo);
if(Session.get("paymentMethod") === "card") {
  form.paymentInformation[0].card_number =     $(e.target).find('[name=card_number]').val();
  form.paymentInformation[0].expiry_month =    $(e.target).find('[name=expiry_month]').val();
  form.paymentInformation[0].expiry_year =     $(e.target).find('[name=expiry_year]').val();
  form.paymentInformation[0].cvv =             $(e.target).find('[name=cvv]').val();

  //set the form type so the server side method knows what to do with the data.
  form.paymentInformation[0].type = "card";
} else {
  form.paymentInformation[0].account_number =  $(e.target).find('[name=account_number]').val();
  form.paymentInformation[0].routing_number =  $(e.target).find('[name=routing_number]').val();
  form.paymentInformation[0].account_type =    $(e.target).find('[name=account_type]').val();

  //set the form type so the server side method knows what to do with the data.
  form.paymentInformation[0].type = "check";
  Session.equals("paymentMethod", "check");
}
    form._id = Donate.insert(form.created_at);

    /*Deps.autorun(function(){
      var statusValue = Donate.update(form._id, {$set: {status: 'In collection'}});
         notif({
          msg: "<b>" + statusValue + "</b>",
          type: "success",
          position: "right"
        });
    });*/

    //Session.set('status', Donate.findOne(form._id).status);
    Donate.update(form._id, {$set: {
      sessionId: Meteor.default_connection._lastSessionId,
      'recurring.isRecuring': form.recurring,
      'customer': form.customer[0],
      'debit.donateTo': form.paymentInformation[0].donateTo,
      'debit.donateWith': form.paymentInformation[0].donateWith,
      'debit.email_sent': false
    }});
  
    console.log("ID: " + form._id);
    console.log("Session ID: " + Meteor.default_connection._lastSessionId);
/*    Meteor.call('createBillyCustomer', 1, function (error, result) {
      console.log(error);
      console.log(result);
    });*/
    
    if (!recurringStatus.checked) {
    Meteor.call("createCustomer", form, function(error, result) {
        if(result) {
          $('#loading1').modal('hide');

          //Session.set('status', Donate.findOne({id: form._id}).status);
           Router.go('/thanks/' + form._id);
         } else {
          console.log("Error message: " + error.message);
          console.log(error);
          var errorCode = error.error;
          var errorDescription = error.description;
          console.log("description: " + error.description);
          switch (errorCode) {
              case "card-declined":
                  //var sendToErrorFunction = cardDeclined();
                  console.log("Card was declined");
                  //use this area to add the error to the errors collection,
                  //also, send an email to me with the error printed in it
                  //don't need to use mandrill for this (unless that would be 
                  //easier
                  break;
              case "account-insufficient-funds":
                  //var sendToErrorFunction = accountInsufficientFunds();
                  break;
              case "authorization-failed":
                  //var sendToErrorFunction = authorizationFailed();
                  break;
              case "address-verification-failed":
                  //var sendToErrorFunction = addressVerificationFailed();
                  break;
              case "bank-account-not-valid":
                  //var sendToErrorFunction = bankAccountNotValid();
                  break;
              case "card-not-valid":
                  console.log(error.details);
                  //var sendToErrorFunction = cardNotValid();
                  break;
              case "card-not-validated":
                  //this is the error for a card that is to short, probably for other errors too
                  console.log(error.details);
                  //var sendToErrorFunction = cardNotValidated();
                  break;
              case "insufficient-funds":
                  //var sendToErrorFunction = insufficientFunds();
                  break;
              case "multiple-debits":
                  //var sendToErrorFunction = multipleDebits();
                  break;
              case "no-funding-destination":
                  //var sendToErrorFunction = noFundingDestination();
                  break;
              case "no-funding-source":
                  break;
              case "unexpected-payload":
                  break;
              case "bank-account-authentication-forbidden":
                  break;
              case "incomplete-account-info":
                  break;
              case "invalid-amount":
                  break;
              case "invalid-bank-account-number":
                  break;
              case "invalid-routing-number":
                  break;
              case "not-found":
                  break;
              case "request":
                  console.log(error.details);
                  break;
              case "method-not-allowed":
                  break;
              case "amount-exceeds-limit":
                  //use this area to split payment into more than one
                  //then send the multiple payments through, 
                  //or for a temporary workaround print instructions
                  //back to the user, tell them the max and how they can
                  //debit more in sepearte transactions
                  break;
              default:
                  console.log("Didn't match any case");
                  //var sendToErrorFunction = "No Match";
                  break;
            }
            //END Switch case block

          $('#loading1').modal('hide');
        }
        //END error handling block for meteor call to createCustomer

        });
        //END Meteor call block
        } else {
          Meteor.call('testBillyFunction', 1, function (error, result) {
            if (error) {
              console.log(error.error.data.error_class);
              console.log(error.error.data.error_message);
              console.log(error.reason);
            } else {
            console.log(" Result: " + result.data.company_guid);
            console.log(" Result: " + JSON.stringify(result));
            console.log(" Result: " + result.create_at);
          }
          });
        }
  },
  'click [name=is_recurring]': function (e, tmpl) {
      var id = this._id;
      console.log(id);
      var isRecuring = tmpl.find('input').checked;

      Donate.update({_id: id}, {
        $set: { 'recurring.is_recurring': true }
        });
    },
    'click [name=coverTheFees]': function (e, tmpl) {
      var id = this._id;
      console.log(id);
      var coverTheFeesBox = tmpl.find('input').checked;

      Donate.update({_id: id}, {
        $set: { 'coverTheFees': true }
        });
    },
    'keyup [name=amount]': function() {    
      return updateTotal();
    },
    'change [name=amount]': function() {    
      return updateTotal();
    },
    'change [name=coverTheFees]': function() {    
      return updateTotal();
    },
    'click [name=donateWith]': function(e,tmpl) {
      var selectedValue = $("#donateWith").val();
      Session.set("paymentMethod", selectedValue);
    },
    'change [name=donateWith]': function(e,tmpl) {
      var selectedValue = $("#donateWith").val();
      Session.set("paymentMethod", selectedValue);
    }
});

Template.DonationForm.helpers({
  paymentWithCard: function () {
    return Session.equals("paymentMethod", "card");
  },
  attributes_Input_DonationTo: function () {
    return {
        name: "donateTo",
        id: "donateTo",
        class: "form-control",
        value: "{{donation_to}}"
    }
  },
  isRecurringChecked: function () {
    return this.is_recurring ? 'checked' : '';
    },
    coverTheFeesChecked: function () {
        return this.coverTheFees ? 'checked' : '';
    },
    attributes_Input_Amount: function () {
        return {
            name: "amount",
            id: "amount",
            class: "form-control",
            min: "1",
            'data-parsley-trigger': "change",
            'data-parsley-type': "integer",
            "data-parsley-required": true
        }
    },
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
        id: "address_line1",
        class: "form-control",
        value: "",
        placeholder: "address line 1"
      }
    },
    attributes_Input_AddressLine2: function () {
      return {
        type: "text",
        name: "address_line2",
        id: "address_line2",
        class: "form-control",
        value: "",
        placeholder: "address line 2"
      }
    },
    attributes_Input_City: function () {
      return {
        type: "text",
        name: "city",
        id: "city",
        class: "form-control",
        value: "",
        placeholder: "city"
      }
    },
    attributes_Input_State: function () {
      return {
        type: "text",
        name: "region",
        id: "region",
        class: "form-control",
        value: "",
        placeholder: "state / province / region"
      }
    },
    attributes_Input_Zip: function () {
      return {
        type: "text",
        name: "postal_code",
        id: "postal_code",
        class: "form-control",
        value: "",
        placeholder: "zip or postal code"
      }
    },
    attributes_Select_Country: function () {
      return {
        name: "country",
        id: "country",
        class: "form-control"
      }
    },
    attributes_Label_Amount: function () {
        return {
            class: "col-sm-3 control-label",
            for: "amount"
        }
    },
    attributes_Label_Name: function () {
      return {
        class: "col-sm-3 control-label",
        for: "name"
      }
    }
});

/*****************************************************************************/
/* DonationForm: Lifecycle Hooks */
/*****************************************************************************/
Template.DonationForm.created = function () {
};

Template.DonationForm.rendered = function () {

//Parsley form validation setup, commented to test other things while I wait to 
//hear back from the developer on a good example to work from.
/*  $('#donation_form').parsley(parsleyOptions);
  parsleyOptions = {
  // Sets success and error class to Bootstrap class names
  successClass: '',//'has-success',
  errorClass: 'has-error has-feedback',
  trigger: 'change',

  // Bootsrap needs success/error class to be set on parent element
  errors: {
   classHandler: function ( elem, isRadioOrCheckbox ) {
     // specify where parsley error-success classes are set
     return $(elem).parents(".form-group");
   },
   // Set these to empty to make sure the default Parsley elements are not rendered
   errorsWrapper: '',
   errorElem: ''
  },

  listeners: {
   onFieldValidate: function ( elem ) {
     // remove the X from onFieldError if it's there
     elem.next( ".glyphicon-remove" ).remove();
   },

   onFieldError: function ( elem, constraints, parsleyField ) {
     // add the Bootstrap X glyphicon to the right side of the form element
     elem.after( '<span class="glyphicon glyphicon-remove form-control-feedback"></span>' );
     // access the data-required-message="xx" attribute on the field
     throwError( 000, "", elem.data('required-message' ) );
    },

    // onFieldSuccess: function(elem, constraints, parsleyField) {
    //   elem.next().remove( 'form-control-feedback' );
    // }
  }
};*/
};

Template.DonationForm.destroyed = function () {
};




Template.checkPaymentInformation.helpers({

    attributes_Input_AccountNumber: function () {
      return {
        type: "text",
        name: "account_number",
        id: "account_number",
        class: "form-control",
        value: "9900000003"
      }
    },
    attributes_Input_RoutingNumber: function () {
      return {
        type: "text",
        name: "routing_number",
        id: "routing_number",
        class: "form-control",
        value: "321174851",
        'data-parsley-trigger': "change",
        'data-parsley-type': "integer",
        "data-parsley-min": 9,
        "data-parsley-max": 9
      }
    },
    attributes_Label_AccountNumber: function () {
      return {
        class: "col-sm-3 control-label",
        for: "account_number"
      }
    },
    attributes_Label_RoutingNumber: function () {
      return {
        class: "col-sm-3 control-label",
        for: "routing_number"
      }
    }
});