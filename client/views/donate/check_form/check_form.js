/*****************************************************************************/
/* CheckForm: Event Handlers and Helpers */
/*****************************************************************************/
Template.CheckForm.events({
  'submit form': function (e, tmpl) {
    e.preventDefault();
    var recurringStatus = $(e.target).find('[name=is_recurring]').is(':checked');
        var coverTheFeesStatus = $(e.target).find('[name=coverTheFees]').is(':checked');
    var checkForm = {
            amount: $(e.target).find('[name=amount]').val(),
      name: $(e.target).find('[name=name]').val(),
      account_number: $(e.target).find('[name=account_number]').val(),
      routing_number: $(e.target).find('[name=routing_number]').val(),
      recurring: { is_recurring: recurringStatus },
      created_at: new Date
    }
    checkForm._id = Donations.insert(checkForm);

            Meteor.call("createCustomerWithThen", checkForm, function(error, result) {
                console.log(error);
                console.log(result);
                console.log(result.customers[0].href);
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
            $('#response .panel-body pre').html(JSON.stringify(result, false, 4));
            $('#response').slideDown(300);
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

      Donations.update({_id: id}, {
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

      Donations.update({_id: id}, {
        $set: { 'coverTheFees': true }
        });
    }
});

Template.CheckForm.helpers({
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
            class: "form-control"
        }
    },
    attributes_Input_Name: function () {
      return {
        type: "text",
        name: "name",
        class: "form-control",
        value: "John Doe"
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
        value: "321174851"
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

/*****************************************************************************/
/* CheckForm: Lifecycle Hooks */
/*****************************************************************************/
Template.CheckForm.created = function () {
};

Template.CheckForm.rendered = function () {
};

Template.CheckForm.destroyed = function () {
};
