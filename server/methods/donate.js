/* Donate Methods */
/*****************************************************************************/
Fiber = Npm.require('fibers');

Meteor.methods({
    singleDonation: function (data) {
        logger.info("Started singleDonation");
        try {

            //Check the form to make sure nothing malicious is being submitted to the server
            Utils.checkFormFields(data);

            //Convert donation to more readable format
            var donateTo = Utils.getDonateTo(data.paymentInformation.donateTo);

            if(donateTo === 'Write In') {
                donateTo = data.paymentInformation.writeIn;
            }

            //initialize the balanced function with our API key.
            balanced.configure(Meteor.settings.balanced_api_key);

            var customerData = Utils.create_customer(data.customer, false);
            console.log("LOOK HERE *************");
            console.dir(customerData);


            data._id = Donations.insert({
                created_at: data.paymentInformation.created_at,
                sessionId: data.sessionId,
                URL: data.URL,
                'donateTo': donateTo,
                'donateWith': data.paymentInformation.donateWith,
                'type': data.paymentInformation.type,
                'total_amount': data.paymentInformation.total_amount,
                'amount': data.paymentInformation.amount,
                'fees': data.paymentInformation.fees,
                'coveredTheFees': data.paymentInformation.coverTheFees,
                'customer_id': customerData.id,
                'status': 'pending'
            });
            logger.info("ID: " + data._id);

            //Runs if the form used was the credit card form, which sets type as part of the array which is passed to this server side function

            if (data.paymentInformation.donateWith === "Card") {
                
                //Get the card data from balanced and store it
                var card = Utils.get_card(customerData._id, data.paymentInformation.href);

                //Create a new order
                var orders = Utils.create_order(data._id, customerData.href);

                //Associate the card with the balanced customer
                var associate = Utils.create_association(customerData._id, card.href, customerData.href);

                //Debit the order
                var debit_id = Utils.debit_order(data.paymentInformation.total_amount, data._id, customerData._id, orders.href, card.href);

            }
            //for running ACH
            else {
                console.log(data.paymentInformation.href);

                //Get the check data from balanced and store it
                var check = Utils.get_check(customerData._id, data.paymentInformation.href);

                //Create a new order
                var orders = Utils.create_order(data._id, customerData.href);

                //Associate the card with the balanced customer
                var associate = Utils.create_association(customerData._id, check.href, customerData.href);

                //Debit the order
                var debit_id = Utils.debit_order(data.paymentInformation.total_amount, data._id, customerData._id, orders.href, check.href);

            }

            // setTimeout is used here to let the function return to the user and then run Utils.create_user
            // since Utils.create_user can take 10 seconds or more to run and since I don't want to print any errors
            // from it out to the user
            Meteor.setTimeout(function(){
                Utils.post_donation_operation(customerData._id, data._id, debit_id);
            }, 1000);

            return {c: customerData._id, don: data._id, deb: debit_id};

        } catch (e) {
            logger.error("Got to catch error area of processPayment function." + e + " " + e.reason);
            logger.error("e.category_code = " + e.category_code + " e.descriptoin = " + e.description);
            if(e.category_code) {
                logger.error("Got to catch error area of create_associate. ID: " + data._id + " Category Code: " + e.category_code + ' Description: ' + e.description);
                var debitSubmitted = '';
                if(e.category_code === 'invalid-routing-number'){
                    debitSubmitted = false;
                }
                Donations.update(data._id, {
                    $set: {
                    'failed.category_code': e.category_code,
                    'failed.description': e.description,
                    'failed.eventID': e.request_id,
                    'debit.status': 'failed',
                    'debit.submitted': debitSubmitted
                    }
                });
                throw new Meteor.Error(500, e.category_code, e.description);
            } else {
                throw new Meteor.Error(500, e.reason, e.details);
            }
         }
    }
});

