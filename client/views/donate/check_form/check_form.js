/*****************************************************************************/
/* CheckForm: Event Handlers and Helpers */
/*****************************************************************************/

Template.CheckForm.events({
  'submit form': function (e, tmpl) {
    e.preventDefault();
    var recurringStatus =     $(e.target).find('[name=is_recurring]').is(':checked');
    var coverTheFeesStatus =  $(e.target).find('[name=coverTheFees]').is(':checked');
    var checkForm =           {
                                amount:         $(e.target).find('[name=amount]').val(),
                                total_amount:   $(e.target).find('[name=amount]').val(),
                                fname:          $(e.target).find('[name=fname]').val(),
                                lname:          $(e.target).find('[name=lname]').val(),
                                email_address:  $(e.target).find('[name=email_address]').val(),
                                phone_number:   $(e.target).find('[name=phone_number]').val(),
                                address_line1:  $(e.target).find('[name=address_line1]').val(),
                                address_line2:  $(e.target).find('[name=address_line2]').val(),
                                city:          $(e.target).find('[name=city]').val(),
                                region:         $(e.target).find('[name=region]').val(),
                                postal_code:    $(e.target).find('[name=postal_code]').val(),
                                country:        $(e.target).find('[name=country]').val(),
                                account_number: $(e.target).find('[name=account_number]').val(),
                                routing_number: $(e.target).find('[name=routing_number]').val(),
                                account_type: $(e.target).find('[name=account_type]').val(),
                                recurring:      { is_recurring: recurringStatus },
                                donateTo:       $(e.target).find('[name=donationTo]').val(),
                                donateWith:     $(e.target).find('[name=donationWith]').val(),
                                created_at:     new Date().getTime()
    }
    checkForm._id = Donate.insert(checkForm);
    Donate.update(checkForm._id, {$set: {sessionId: Meteor.default_connection._lastSessionId}});
  
    checkForm.type = "check";
    console.log('ID: ' + checkForm._id);
    console.log('Session ID: ' + Meteor.default_connection._lastSessionId);

     //checkForm._id = Donate.insert(checkForm);
    Meteor.call("createCustomer", checkForm, function(error, result) {
            
        console.log("Error: " + error + "  Result: " + JSON.stringify(result, false, 4)); 
        //console.log(result.status);
        console.log(result);
        console.log(error);
        //console.log(result.customers[0].href);
       /*if (error) {
            Router.go('/failed/' + checkForm._id);
        } else {
            Router.go('/receipt/' + checkForm._id);
        }*/

    });
    Router.go('/receipt/' + checkForm._id);
  },
  'click [name=is_recurring]': function (e, tmpl) {
      var id = this._id;
      console.log(id);
      var isRecuring = tmpl.find('input').checked;

      Donations.update({_id: id}, {
        $set: { 'recurring.is_recurring': true }
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
            class: "form-control",
            min: "1"
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
        value: "321174851",
        maxlength: "9"
      }
    },
    attributes_Input_DonationTo: function () {
        return {
            name: "donationTo",
            class: "form-control"
      }
    },
    attributes_Input_DonationWith: function () {
        return {
            name: "donationWith",
            class: "form-control",
            value: "Check"
      }
    },
    attributes_Label_Amount: function () {
        return {
            class: "col-sm-3 control-label",
            for: "amount"
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
