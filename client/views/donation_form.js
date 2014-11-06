/*****************************************************************************/
/* DonationForm: Event Handlers and Helpers */
/*****************************************************************************/
// this function is used to update the displayed total
// since we can take payment with card fees added in this is needed to update the
// amount that is shown to the user and passed as total_amount through the form
//display error modal if there is an error while initially submitting data from the form.
function handleErrors(error) {
    //console.log(error.errors);
    if(error.reason === "Match failed"){
        var gatherInfo = {};
        gatherInfo.browser = navigator.userAgent

        error.details = "<tr>\
                        <td><p>Hmmm... Looks like the form was submitted with something in it that computers don't like. Computers have\
                         a strict diet, so don't try to feed them anything that they shouldn't eat. <-- Think here of dogs and chocolate ;-)</p></td>\
                        </tr>\
                    <tr>\
                        <td><p>Try these to see if it fixes the form.</p></td>\
                    </tr>\
                        <td><p>1. Look through the fields and make sure they all have the right kind of information in them. Numbers in number fields letters in letter fields, etc.. \
                        Then try to submit the form again.</p></td>\
                    </tr>\
                    <tr>\
<td><p>2. If the form looks correct and you still get this error there could be a temporary problem preventing the form from being submitted. Try reloading the browser. \
If you are still having problems, try rebooting your computer. If you come back here and you still have problems then please report this to tech support. <br> \
<center><a target='_blank' href='mailto:support@trashmountain.com?subject=Trouble with the match field on the giving page&body=Boy, I sure love dogs. \
But I&#39;m not here to talk about dogs, or cats. I&#39;m having a problem giving to your fine organization. %0A%0A\
What&#39;s more, I&#39;ve tried all the steps listed on your site but I still can&#39;t give. What gives(pun intended)? Please help. %0A%0A\
Please leave the below information in the email. This will help us get to the bottom of the problem. %0A%0A User Agent: " + gatherInfo.browser + "%0A\
Language:  " + window.navigator.language + "%0A\
IE Language:  " + navigator.userLanguage + "%0A\
Location HREF: " + location.href + "'><button type='button' class='btn btn-danger'>Send an e-mail to support</button></a></center></p></td>\
                    </tr>\
                </tr>";

        $('#modal_for_initial_donation_error').modal('show');
        $('#errorCategory').html(error.reason);
        $('#errorDescription').html(error.details);  
    } else{
        //$('#modal_for_initial_donation_error').modal('show');
        $('#error-alert').show();
        $('#errorCategory').html(error.reason);
        $('#errorDescription').html(error.details);
    }
    
}

function fillForm() {
    if (Session.get("paymentMethod") === "Check") {
        $('#routing_number').val("321174851"); // Invalid test = 100000007 valid test = 321174851
        $('#account_number').val("9900000003"); // Invalid test = 8887776665555 valid test = 9900000003
    } else {
        $('#card_number').val("4111111111111111"); //Succeeded = 4111111111111111 Failed = 4444444444444448 CVV mismatch = 5112000200000002
        $('#expiry_month option').prop('selected', false).filter('[value=12]').prop('selected', true);
        $('select[name=expiry_month]').change();
        $('#expiry_year option').prop('selected', false).filter('[value=2015]').prop('selected', true);
        $('select[name=expiry_year]').change();
        $('#cvv').val("123"); //CVV mismatch = 200
    }
    $('#fname').val("John");
    $('#lname').val("Doe");
    $('#org').val("Business Name");
    $('#email_address').val("josh@trashmountain.com");
    $('#phone').val("(785) 246-6845");
    $('#address_line1').val("Address Line 1");
    $('#address_line2').val("Address Line 2");
    $('#city').val("Topeka");
    $('#region').val("KS");
    $('#postal_code').val("66618");
    $('#amount').val("1.03");
}

function updateTotal() {
    var data = Session.get('paymentMethod');
    var donationAmount = $('#amount').val();
    donationAmount = donationAmount.replace(/[^\d\.\-\ ]/g, '');
    donationAmount = donationAmount.replace(/^0+/, '');
    if (data === 'Check') {
        if ($.isNumeric(donationAmount)) {
            $("#total_amount").val(donationAmount);
            var testValueTransfer = $("#total_amount").val();
            $("#total_amount_display").text("$" + donationAmount).css({
                'color': '#34495e'
            });
            return Session.set("total_amount", testValueTransfer);
        } else {
            return $("#total_amount_display").text("Please enter a number in the amount field").css({
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
                    var fee = (donationAmount * 0.029 + 0.30).toFixed(2);
                    var roundedAmount = (+donationAmount + (+fee)).toFixed(2);
                    $("#total_amount_display").text("$" + donationAmount + " + $" + fee + " = $" + roundedAmount).css({
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
                return $("#total_amount_display").text("Please enter a number in the amount field").css({
                    'color': 'red'
                });
            }
        }
    }
}

function toggleBox() {
    $(':checkbox').checkbox('toggle');
}

//This is the callback for the client side tokenization of cards and bank_accounts.
function handleCalls(payment, form) {
    form.paymentInformation.href = payment.href;
    form.paymentInformation.id = payment.id;    

    if ($('#is_recurring').val() === 'one_time') {
        Meteor.call("singleDonation", form, function (error, result) {
            if (result) {
                $('#loading1').modal('hide');
                Router.go('/give/thanks/' + result);
            } else {
                //run updateTotal so that when the user resubmits the form the total_amount field won't be blank.
                updateTotal();
                $('#loading1').modal('hide');
                handleErrors(error);
            }
            //END error handling block for meteor call to processPayment
        });
        //END Meteor call block
    } else if ($('#is_recurring').val() === 'monthly') {
        Meteor.call('recurringDonation', form, function (error, result) {
            if (result) {
                $('#loading1').modal('hide');
                Router.go('/give/gift/' + result._id + '/?transaction_guid=' + result.transaction_guid);
            } else {
                //run updateTotal so that when the user resubmits the form the total_amount field won't be blank.
                updateTotal();
                $('#loading1').modal('hide');
                //handleErrors is used to check the returned error and the display a user friendly message about what happened that caused
                //the error.
                handleErrors(error);
            }
        });
    }
}

Template.DonationForm.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        updateTotal();
        if (($('#total_amount').val()) > 15000) {
            var error = {};
            error.reason = 'Exceeds processor amount';
            error.details = "<tr>\
                        <td>Sorry, our processor will not allow us to accept gifts larger than $15,000.&nbsp; Here are a couple of options.</td>\
                    <tr>\
                        <td>1. Split your gift into several donations.</td>\
                    </tr>\
                        <td>2. Call us and give your gift over the phone by ACH.&nbsp; <tel>(785)246-6845</tel></td>\
                    </tr>\
                    <tr>\
                        <td>3. Mail your check of any amount to<br> 1555 NW Gage BLVD. <br>Topeka, KS 66618</td>\
                    </tr>\
                </tr>";
            handleErrors(error);
            throw new Meteor.Error(error);
        }
        //Start the bootstrap modal with the awesome font refresh logo
        //Also, backdrop: 'static' sets the modal to not be exited when
        //a user clicks in the background.
        $('#loading1').modal({
            visibility: 'show',
            backdrop: 'static'
        });
        var form = {
            "paymentInformation": {
                "amount": parseInt(($('#amount').val().replace(/[^\d\.\-\ ]/g, '')) * 100),
                "total_amount": parseInt($('#total_amount').val() * 100),
                "donateTo": $("#donateTo").val(),
                "writeIn": $("#enteredWriteInValue").val(),
                "donateWith": $("#donateWith").val(),
                "is_recurring": $('#is_recurring').val(),
                "coverTheFees": $('#coverTheFees').is(":checked"),
                "created_at": moment().format('MM/DD/YYYY, hh:mm')
            },
            "customer": {
                "fname": $('#fname').val(),
                "lname": $('#lname').val(),
                "org": $('#org').val(),
                "email_address": $('#email_address').val(),
                "phone_number": $('#phone').val(),
                "address_line1": $('#address_line1').val(),
                "address_line2": $('#address_line2').val(),
                "region": $('#region').val(),
                "city": $('#city').val(),
                "postal_code": $('#postal_code').val(),
                "country": $('#country').val(),
                "created_at": moment().format('MM/DD/YYYY, hh:mm')
            },
            "URL": document.URL,
            sessionId: Meteor.default_connection._lastSessionId
        };
        //
        if (form.paymentInformation.total_amount !== form.paymentInformation.amount) {
            form.paymentInformation.fees = (form.paymentInformation.total_amount - form.paymentInformation.amount);
        }
        if (form.paymentInformation.donateWith === "Card") {
            form.paymentInformation.type = "Card";
            var payload = {
                name: $('#fname').val() + ' ' + $('lname').val(),
                number: $('[name=card_number]').val(),
                expiration_month: $('[name=expiry_month]').val(),
                expiration_year: $('[name=expiry_year]').val(),
                cvv: $('[name=cvv]').val(),
                address: {
                    postal_code: $('#postal_code').val()
                }
            };

            balanced.card.create(payload, function (response) {
                // Successful tokenization
                if (response.status_code === 201) {
                    var fundingInstrument = response.cards != null ? response.cards[0] : response.bank_accounts[0];
                    // Call your backend
                    handleCalls(fundingInstrument, form);
                } else {
                    //error logic here
                    console.log("Error");
                }
            });
        } else {
            form.paymentInformation.type = "Check";
            var payload = {
                name: $('#fname').val() + ' ' + $('lname').val(),
                account_number: $('#account_number').val(),
                routing_number: $('#routing_number').val(),
                account_type: $('#account_type').val()
            };
            balanced.bankAccount.create(payload, function (response) {
                // Successful tokenization
                if (response.status_code === 201) {
                    var fundingInstrument = response.bank_accounts != null ? response.bank_accounts[0] : response.cards[0];
                    // Call your backend
                    handleCalls(fundingInstrument, form);
                } else {
                    //error logic here
                    console.error(response);
                }
            });
        }
    },
    'click #is_recurring': function() {
        if ($("#is_recurring").val() === 'monthly') {
            Session.set('recurring', true);
        } else {
            Session.set('recurring', false);
        }
    },
    'keyup, change #amount': function() {
        return updateTotal();
    },
    // disable mousewheel on a input number field when in focus
    // (to prevent Cromium browsers change the value when scrolling)
    'focus #amount': function(e, tmpl) {
        $('#amount').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
    },
    'blur #amount': function(e) {
        $('#amount').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
        return updateTotal();
    },
    'change [name=coverTheFees]': function() {
        return updateTotal();
    },
    'click [name=donateWith]': function() {
        var selectedValue = $("[name=donateWith]").val();
        Session.set("paymentMethod", selectedValue);
    },
    'change [name=donateWith]': function() {
        setTimeout(function() {
            toggleBox(); //call the same function twice,
            toggleBox(); //ugly hack to fix the box not appearing when switching between check and card
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
    'focus, blur #cvv': function(e) {
        $('#cvv').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
    },
    'focus, blur #card_number': function(e) {
        $('#card_number').on('mousewheel.disableScroll', function(e) {
            e.preventDefault();
        });
    },
    'click #write_in_save': function (e) {
        $('#modal_for_write_in').modal('hide');
        function removeParam(key, sourceURL) {
            var rtn = sourceURL.split("?")[0],
                param,
                params_arr = [],
                queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
            if (queryString !== "") {
                params_arr = queryString.split("&");
                for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                    param = params_arr[i].split("=")[0];
                    if (param === key) {
                        params_arr.splice(i, 1);
                    }
                }
                rtn = rtn + "?" + params_arr.join("&");
            }
            return rtn;
        }
        var goHere = removeParam('enteredWriteInValue', window.location.href);
        console.log(goHere);
        Session.set('showWriteIn', 'no');
        var goHere = goHere + '&enteredWriteInValue=' + $('#writeIn').val();
        Router.go(goHere);
    }
});
Template.DonationForm.helpers({
    paymentWithCard: function() {
        return Session.equals("paymentMethod", "Card");
    },
    coverTheFeesChecked: function() {
        return this.coverTheFees ? 'checked' : '';
    },
    attributes_Input_Amount: function() {
        return {
            name: "amount",
            id: "amount",
            type: "digits",
            min: 1,
            required: true
        };
    },
    errorCategory: function() {
        return 'Error Category';
    },
    errorDescription: function() {
        return 'Error Description';
    },
    amount: function() {
        return Session.get('params.amount');
    },
    writeInValue: function () {
        return Session.get('params.enteredWriteInValue');
    }
});
/*****************************************************************************/
/* DonationForm: Lifecycle Hooks */
/*****************************************************************************/
Template.DonationForm.created = function() {};
Template.DonationForm.rendered = function() {
    // Setup parsley form validation
    $('#donation_form').parsley();

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
    //setup modal for entering give toward information

    if (Session.equals('params.donateTo', 'WriteIn') && !(Session.equals('showWriteIn', 'no'))) {
        $('#modal_for_write_in').modal({
            show: true,
            backdrop: 'static'
        });
    }
};
Template.checkPaymentInformation.helpers({
    attributes_Input_AccountNumber: function() {
        return {
            type: "text",
            name: "account_number",
            id: "account_number",
            placeholder: "Bank Account Number",
            required: true
        };
    },
    attributes_Input_RoutingNumber: function() {
        return {
            type: "text",
            name: "routing_number",
            id: "routing_number",
            placeholder: "Routing numbers are 9 digits long",
            required: true
        };
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
};
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
        title: 'Our credit card processor charges 2.9% + .30 per transaction. If you check the box to cover these fees we\'ll do the math and change your gift amount to reflect this amount.',
        placement: 'auto top'
    });
};