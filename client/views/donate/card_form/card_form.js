/*****************************************************************************/
/* CardForm: Event Handlers and Helpers */
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

Template.CardForm.events({
  'submit form': function (e, tmpl) {
    e.preventDefault();
    
    var recurringStatus =     $(e.target).find('[name=is_recurring]').is(':checked');
    var coverTheFeesStatus =  $(e.target).find('[name=coverTheFees]').is(':checked');
    var cardForm = {
      amount:         $(e.target).find('[name=amount]').val(),
      fname:          $(e.target).find('[name=fname]').val(),
      lname:          $(e.target).find('[name=lname]').val(),
      address_line1:  $(e.target).find('[name=address_line1]').val(),
      address_line2:  $(e.target).find('[name=address_line2]').val(),
      region:         $(e.target).find('[name=region]').val(),
      state:          $(e.target).find('[name=state]').val(),
      postal_code:    $(e.target).find('[name=postal_code]').val(),
      country:        $(e.target).find('[name=country]').val(),
      card_number:    $(e.target).find('[name=card-number]').val(),
      expiry_month:   $(e.target).find('[name=expiry-month]').val(),
      expiry_year:    $(e.target).find('[name=expiry-year]').val(),
      cvv:            $(e.target).find('[name=cvv]').val(),
      recurring:      { is_recurring: recurringStatus },
      created_at:     new Date
    };

    
    cardForm._id = Donate.insert(cardForm);
    Donate.update(cardForm._id, {$set: {sessionId: Meteor.default_connection._lastSessionId}});
  
    cardForm.type = "card";
    console.log(cardForm._id);
    console.log(Meteor.default_connection._lastSessionId);
    
    Meteor.call("createCustomer", cardForm, function(error, result) {

        console.log("Error: " + error + "  Result: " + result); 
        //console.log(result.customers[0].href);
        
        // Successful tokenization
    if(result.status_code === 201 && result.href) {
        // Send to your backend
        jQuery.post(responseTarget, {
            uri: result.href
        }, function(r) {
            // Check your backend result
            if(r.status === 201) {
                // Your successful logic here from backend
            } else {
                // Your failure logic here from backend
            }
        });
    } else {
        // Failed to tokenize, your error logic here
    }
    
    // Debuging, just displays the tokenization result in a pretty div
    $('#response1 .panel-body pre').html(JSON.stringify(result, false, 4));
    $('#response1').slideDown(300);
    });
          
    var form = tmpl.find('form');
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
      // Need to find the amount field on the page and change
      // it to reflect the new amount based on this being checked or unchecked
      // currentValue = $(e.target).find('[name=amount]').val();
      // newValue = Math.round(currentValue * 1.029 + .30);
      // $(e.target).set('[name=amount]').val(newValue); - > not sure if this is the right jQuery command or not

      Donate.update({_id: id}, {
        $set: { 'coverTheFees': true }
        });
    },
    'mouseup [name=amount]': function() {    
      return updateTotal();
    },
    'keyup [name=amount]': function(data) {    
      return updateTotal();
    },
    'change [name=coverTheFees]': function(data) {    
      return updateTotal();
    }
});

Template.CardForm.helpers({
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
            class: "form-control"
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
/* CardForm: Lifecycle Hooks */
/*****************************************************************************/
Template.CardForm.created = function () {
};

Template.CardForm.rendered = function () {
};

Template.CardForm.destroyed = function () {
};
