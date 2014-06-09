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
    
    var recurringStatus =     $(e.target).find('[name=is_recurring]').is(':checked');
    var coverTheFeesStatus =  $(e.target).find('[name=coverTheFees]').is(':checked');
    var form = {
      amount:         $(e.target).find('[name=amount]').val(),
      total_amount:   $(e.target).find('[name=total_amount]').val(),
      donateTo:       $(e.target).find('[name=donationTo]').val(),
      donateWith:     $(e.target).find('[name=donationWith]').val(),
      fname:          $(e.target).find('[name=fname]').val(),
      lname:          $(e.target).find('[name=lname]').val(),
      email_address:  $(e.target).find('[name=email_address]').val(),
      phone_number:   $(e.target).find('[name=phone_number]').val(),
      address_line1:  $(e.target).find('[name=address_line1]').val(),
      address_line2:  $(e.target).find('[name=address_line2]').val(),
      region:         $(e.target).find('[name=region]').val(),
      city:          $(e.target).find('[name=city]').val(),
      postal_code:    $(e.target).find('[name=postal_code]').val(),
      country:        $(e.target).find('[name=country]').val(),
      card_number:    $(e.target).find('[name=card-number]').val(),
      expiry_month:   $(e.target).find('[name=expiry-month]').val(),
      expiry_year:    $(e.target).find('[name=expiry-year]').val(),
      cvv:            $(e.target).find('[name=cvv]').val(),
      recurring:      { is_recurring: recurringStatus },
      created_at:     new Date().getTime()
    };

if(Session.get("paymentMethod") === "card") {
  form.card_number =     $(e.target).find('[name=card-number]').val();
  form.expiry_month =    $(e.target).find('[name=expiry-month]').val();
  form.expiry_year =     $(e.target).find('[name=expiry-year]').val();
  form.cvv =             $(e.target).find('[name=cvv]').val();

  //set the form type so the server side method knows what to do with the data.
  form.type = "card";
} else {
  form.account_number =  $(e.target).find('[name=account_number]').val();
  form.routing_number =  $(e.target).find('[name=routing_number]').val();
  form.account_type =    $(e.target).find('[name=account_type]').val();

  //set the form type so the server side method knows what to do with the data.
  form.type = "check";
}

    form._id = Donate.insert(form);
    Donate.update(form._id, {$set: {sessionId: Meteor.default_connection._lastSessionId}});
  
    
    console.log(form.type);
    console.log("ID: " + form._id);
    console.log("Session ID: " + Meteor.default_connection._lastSessionId);
    
    Meteor.call("createCustomer", form, function(error, result) {

        console.dir(error);
        console.dir(result);
        //console.log(result.customers[0].href);
    });
          
    Router.go('/thanks/' + form._id);
    //var form = tmpl.find('form');
    //form.reset();
    //Will need to add route to receipt page here.
    //Something like this maybe - Router.go('receiptPage', checkForm);
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
    'click [name=donationWith]': function(e,tmpl) {
      var selectedValue = $("#donationWith").val();
      Session.set("paymentMethod", selectedValue);
    }
});

Template.DonationForm.helpers({
  paymentWithCard: function () {
    return Session.equals("paymentMethod", "card");
  },
  attributes_Input_DonationTo: function () {
    return {
        name: "donationTo",
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
            type: "number",
            name: "amount",
            id: "amount",
            class: "form-control",
            min: "1"
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
        value: "9900000000"
      }
    },
    attributes_Input_RoutingNumber: function () {
      return {
        type: "text",
        name: "routing_number",
        id: "routing_number",
        class: "form-control",
        value: "321174851",
        maxlength: "9"
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