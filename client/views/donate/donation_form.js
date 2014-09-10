/*****************************************************************************/
/* DonationForm: Event Handlers and Helpers */
/*****************************************************************************/

  // this function is used to update the displayed total
  // since we can take payment with card fees added in this is needed to update the
  // amount that is shown to the user and passed as total_amount through the form

//display error modal if there is an error while initially submitting data from the form.
function handleErrors(error) {
	//console.log(error.errors[0]);
	$('#modal_for_initial_donation_error').modal({
		show: true
	});
	$('#errorCategory').text(error.category_code);
	$('#errorDescription').text(error.description);
}

function fillForm() {
	if (Session.get("paymentMethod") === "check") {
		$('#routing_number').val("321174851");
		$('#account_number').val("9900000003");
	} else {
		$('#card_number').val("4111111111111111");
		$('#expiry_month option').prop('selected', false).filter('[value=12]').prop(
			'selected', true);
		$('select[name=expiry_month]').change();
		$('#expiry_year option').prop('selected', false).filter('[value=2015]').prop(
			'selected', true);
		$('select[name=expiry_year]').change();
		$('#cvv').val("123");
	}
	$('#fname').val("John");
	$('[name="lname"]').val("Doe");
	$('[name="email_address"]').val("josh@trashmountain.com");
	$('#phone').val("(785) 246-6845");
	$('[name="address_line1"]').val("Address Line 1");
	$('[name="address_line2"]').val("Address Line 2");
	$('[name="city"]').val("Topeka");
	$('#region').val("KS");
	$('[name="postal_code"]').val("66618");
	$('#amount').val("1.03");
}

function updateTotal() {
  var data = Session.get('paymentMethod');
  var donationAmount = $('#amount').val();
  donationAmount = donationAmount.replace(/[^\d\.\-\ ]/g, '');
  donationAmount = donationAmount.replace(/^0+/, '');
  if (data == 'check') {
    if ($.isNumeric(donationAmount)) {
      $("#total_amount").val(donationAmount);
      var testValueTransfer = $("#total_amount").val();
      $("#total_amount_display").text("$" + donationAmount).css({
        'color': '#34495e'
      });
      return Session.set("total_amount", testValueTransfer);
    } else {
      return $("#total_amount_display").text(
        "Please enter a number in the amount field").css({
        'color': 'red'
      });
    }
  } else {
    if (donationAmount < 1 && $.isNumeric(donationAmount)) {
      return $("#total_amount_display").text("Amount cannot be lower than $1.").css({
        'color': 'red'
      });
    } else {
      if ($.isNumeric(donationAmount)) {
        if ($('#coverTheFees').prop('checked')) {
          var fee = Math.round(donationAmount * 0.029 + 0.30);
          var roundedAmount = (+donationAmount + (+fee));
          $("#total_amount_display").text("$" + donationAmount + " + $" + fee +
            " = $" + roundedAmount).css({
            'color': '#34495e'
          });
          $("#total_amount").val(roundedAmount);
          return Session.set("amount", roundedAmount);
        } else {
          $("#total_amount").val(donationAmount);
          return $("#total_amount_display").text("$" + donationAmount).css({
            'color': '#34495e'
          });
        }
      } else {
        return $("#total_amount_display").text(
          "Please enter a number in the amount field").css({
          'color': 'red'
        });
      }
    }
  }
}
uncheckThatBox = function() {
  $(':checkbox').checkbox('toggle');
}
Template.DonationForm.events({
  'submit form': function(e, tmpl) {
    e.preventDefault();
	updateTotal();
    //Start the bootstrap modal with the awesome font refresh logo
    //Also, backdrop: 'static' sets the modal to not be exited when
    //a user clicks in the background.
    $('#loading1').modal({
      visibility: 'show',
      backdrop: 'static'
    });

    //var coverTheFeesStatus =  $(e.target).find('[name=coverTheFees]').is(':checked');
    var form = {
      "paymentInformation": [{
        "amount": $('#amount').val().replace(/[^\d\.\-\ ]/g, ''),
        "total_amount": $('#total_amount').val(),
        "donateTo": $("#donateTo").val(),
        "donateWith": $("#donateWith").val(),
        "is_recurring": $('#is_recurring').val(),
        "coverTheFees": $('#coverTheFees').is(":checked"),
        "created_at": moment().format('MM/DD/YYYY, hh:mm')
      }],
      "customer": [{
        "fname": $('[name=fname]').val(),
        "lname": $('[name=lname]').val(),
        "email_address": $('[name=email_address]').val(),
        "phone_number": $('[name=phone_number]').val(),
        "address_line1": $('[name=address_line1]').val(),
        "address_line2": $('[name=address_line2]').val(),
        "region": $('[name=region]').val(),
        "city": $('[name=city]').val(),
        "postal_code": $('[name=postal_code]').val(),
        "country": $('[name=country]').val(),
        "created_at": moment().format('MM/DD/YYYY, hh:mm')
      }],
      "URL": document.URL,
      sessionId: Meteor.default_connection._lastSessionId
    };


    if (form.paymentInformation[0].donateWith === "card") {
      form.paymentInformation[0].card_number = $('[name=card_number]').val();
      form.paymentInformation[0].expiry_month = $('[name=expiry_month]').val();
      form.paymentInformation[0].expiry_year = $('[name=expiry_year]').val();
      form.paymentInformation[0].cvv = $('[name=cvv]').val();
      //set the form type so the server side method knows what to do with the data.
      form.paymentInformation[0].type = "card";
    } else {
      form.paymentInformation[0].account_number = $('[name=account_number]').val();
      form.paymentInformation[0].routing_number = $('[name=routing_number]').val();
      form.paymentInformation[0].account_type = $('[name=account_type]').val();
      //set the form type so the server side method knows what to do with the data.
      form.paymentInformation[0].type = "check";
    }

    //Move inert and update from here.
    if ($('#is_recurring').val() === 'one_time') {
      Meteor.call("processPayment", form, function(error, result) {
        if (result) {
          $('#loading1').modal('hide');
          Meteor.call('logNewGift', result, function (error, result) {
          });
          Router.go('/give/thanks/' + result);
        } else {
            console.log(error);
	      //run updateTotal so that when the user resubmits the form the total_amount field won't be blank.
	      updateTotal();
             $('#loading1').modal('hide');

             var storedError = error.error;
             handleErrors(error.error);
        }
        //END error handling block for meteor call to processPayment
      });
      //END Meteor call block
    } else {
      Meteor.call('createCustomer', form, function(error, result) {
        if (result) {
          $('#loading1').modal('hide');
          // In the recurring gifts section we won't know if the gift was successful until after Billy returns this data (at a later time)
          /*Meteor.call('logNewGift', result, function (error, result) {
          });*/
          Router.go('/give/thanks/' + result);
        } else {
            console.log(error);
	      //run updateTotal so that when the user resubmits the form the total_amount field won't be blank.
	      updateTotal();
            $('#loading1').modal('hide');

            var storedError = error.error;
            //handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
            //the error.
            handleErrors(error.error);
        }
      });
    }
  },
  'click [name=is_recurring]': function(e, tmpl) {
    if ($("#is_recurring").val() == 'monthly') {
      Session.set('recurring', true);
    } else {
      Session.set('recurring', false);
    }
  },
  'keyup, change #amount': function() {
    return updateTotal();
  },/*
  'change #amount': function() {
    return updateTotal();
  },*/// disable mousewheel on a input number field when in focus
	// (to prevent Cromium browsers change the value when scrolling)
	'focus #amount': function(e, tmpl) {
		$('#amount').on('mousewheel.disableScroll', function(e) {
			e.preventDefault();
		});
	},
	'blur #amount': function(e, tmpl) {
		$('#amount').on('mousewheel.disableScroll', function(e) {});
		return updateTotal();
	},
  'change [name=coverTheFees]': function() {
    return updateTotal();
  },
  'click [name=donateWith]': function(e, tmpl) {
    var selectedValue = $("[name=donateWith]").val();
    Session.set("paymentMethod", selectedValue);
    /*
      updateTotal(selectedValue);*/
  },
  'change [name=donateWith]': function(e, tmpl) {
    setTimeout(function() {
      uncheckThatBox(); //call the same function twice,
      uncheckThatBox(); //ugly hack to fix the box not appearing when switching between check and card
    }, 20);
    var selectedValue = $("[name=donateWith]").val();
    Session.set("paymentMethod", selectedValue);
    /*
      updateTotal(selectedValue);*/
  },
  //keypress input detection for autofilling form with test data
  'keypress input': function(e) {
    if (e.which === 17) { //17 is ctrl + q
      fillForm();
    }
  },
  'focus #cvv': function(e, tmpl) {
    $('#cvv').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur #cvv': function(e, tmpl) {
    $('#cvv').on('mousewheel.disableScroll', function(e) {});
  },
  'focus #card_number': function(e, tmpl) {
    $('#card_number').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur #card_number': function(e, tmpl) {
    $('#card_number').on('mousewheel.disableScroll', function(e) {});
  }
});
Template.DonationForm.helpers({
  paymentWithCard: function() {
    return Session.equals("paymentMethod", "card");
  },
  coverTheFeesChecked: function() {
    return this.coverTheFees ? 'checked' : '';
  },
  attributes_Input_Amount: function() {
    return {
      name: "amount",
      id: "amount",
      class: "form-control",
      type: "text",
      required: true
    }
  },
  attributes_Label_Amount: function() {
    return {
      class: "col-md-4 control-label",
      for: "amount"
    }
  },
	errorCategory: function () {
		return 'Error Category';
	},
	errorDescription: function () {
		return 'Error Description';
	}
});
/*****************************************************************************/
/* DonationForm: Lifecycle Hooks */
/*****************************************************************************/
Template.DonationForm.created = function() {};
Template.DonationForm.rendered = function() {
  // Setup parsley form validation
  $('#donation_form').parsley();
  //Set the mask for the input field lZero is used to deny leading zeros
  //https://github.com/BobKnothe/autoNumeric
  $('#amount').autoNumeric({
    lZero: 'deny',
    vMin: 1
  });
  //Set the checkboxes to unchecked
  $(':checkbox').checkbox('uncheck');
  //Set the tooltips for the question mark icons.
  $('[name=donationSummary]').tooltip({
    trigger: 'hover focus',
    template: '<div class="tooltip tooltipWide" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltipInnerWide"></div></div>',
    title: 'Below is the summary of your donation. To change your options please use the dropdown buttons.',
    placement: 'auto top'
  });
  //Change the select elements to button style dropdowns
  $('select[name=donateWith]').selectpicker({
    style: 'btn-primary',
    menuStyle: 'dropdown-inverse'
  });
  $('select[name=donateTo]').selectpicker({
    style: 'btn-primary',
    menuStyle: 'dropdown-inverse'
  });
  $('select[name=is_recurring]').selectpicker({
    style: 'btn-primary',
    menuStyle: 'dropdown-inverse'
  });
};
Template.DonationForm.destroyed = function() {};
Template.checkPaymentInformation.helpers({
  attributes_Input_AccountNumber: function() {
    return {
      type: "text",
      name: "account_number",
      id: "account_number",
      class: "form-control",
      placeholder: "Bank Account Number",
      required: true
    }
  },
  attributes_Input_RoutingNumber: function() {
    return {
      type: "text",
      name: "routing_number",
      id: "routing_number",
      class: "form-control",
      placeholder: "Routing numbers are 9 digits long",
      required: true
    }
  }
});
//Check Payment Template mods
Template.checkPaymentInformation.rendered = function() {
  $('select[name="account_type"]').selectpicker({
    style: 'btn-lg',
    menuStyle: 'dropdown-inverse',
    'min-height': '80px'
  });
  $("#routing_number").mask("999999999");
  $('#accountTypeQuestion').tooltip({
    container: 'body',
    trigger: 'hover focus',
    template: '<div class="tooltip tooltipWide" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltipInnerWide"></div></div>',
    title: 'Give by ACH. There are usually 3 sets of numbers at the bottom of a check. The short check number, the 9 digit routing number and the account number.',
    placement: 'auto top'
  });
}
Template.checkPaymentInformation.created = function() {}
  //Card Payment Template mods
Template.cardPaymentInformation.rendered = function() {
  $('#expirationDataQuestion').tooltip({
    container: 'body',
    trigger: 'hover focus',
    title: 'Card expiration date',
    placement: 'auto top'
  });
  $('#coverTheFeesQuestion').tooltip({
    container: 'body',
    trigger: 'hover focus',
    template: '<div class="tooltip tooltipWide" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltipInnerWide"></div></div>',
    title: 'Our credit card processor charges 2.9% + .30 per transaction. If you check the box to cover these fees we\'ll do the math and round to the nearest whole dollar.',
    placement: 'auto top'
  });
}