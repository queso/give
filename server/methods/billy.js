Billy = {
	createBillyCustomer: function(customerID){
		try {
			logger.info('Started createBillyCustomer');
			logger.info('Customer ID from balanced: ' + customerID);
			var resultSet = '';

			resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
				params: {
					"processor_uri": "/customers/" + customerID
				},
				auth: Meteor.settings.billy_key + ':'
			});
			logger.info("Company ID: " + resultSet.data.company_guid);
			return resultSet.data;
		} catch (e) {
			logger.info(e);
			e._id = AllErrors.insert(e);
			var error = (e.response);
			throw new Meteor.Error(error, e._id);
		}
	},
	createPaymentMethod: function(customer_id, donateWith, href, processor_uri) {
		try {
		logger.info("Started createPaymentMethod");

		logger.info("In create Payment Method before if: " + donateWith);

		if (donateWith === "Card") {
			logger.info("Stepped into createPaymentMethod card if statement");

			//Get card URL
			var card = Utils.get_card(customer_id, href);

			logger.info("Finished adding card into the collection.");
			logger.info("Started Associate Function.");

			var associate = Utils.create_association(customer_id, card.href, processor_uri);

		}
		//for running ACH
		else
		{
			logger.info("In check portion of create payment Method");
			//Create bank account
			var check = Utils.get_check(customer_id, href);

			logger.info("Finished adding bank_account into the collection.");
			logger.info("Started Associate Function.");
			associate = Utils.create_association(customer_id, check.href, processor_uri);

		}
		}catch (e) {
		 if(e.category_code) {
		 logger.error("Category_code area: e.details " + e.details);
		 throw new Meteor.Error(500, e.category_code, e.description);
		 }else {
		 logger.error("No category_code area: e.details " + e.details);
		 throw new Meteor.Error(500, e.reason, e.details);
		 }
		 //throwTheError(e);
		 }
	},
	subscribeToBillyPlan: function(donation_id, customer_id, paymentType, funding_instrument_uri) {
		try {
            logger.info("Started subscribeToBillyPlan");

            var donate_doc = Donations.findOne(donation_id);
            var plan_guid;
            if(donate_doc.is_recurring === "monthly"){
                plan_guid = Meteor.settings.billy_monthly_GUID;
            }else if(donate_doc.is_recurring === "weekly"){
                plan_guid = Meteor.settings.billy_weekly_GUID;
            }else if(donate_doc.is_recurring === "daily"){
                plan_guid = Meteor.settings.billy_daily_GUID;
            }
            var started_date;
            if(donate_doc.later){
                started_date = donate_doc.start_date;
            } else {
                started_date = '';
            }

            if (paymentType === "credit" || paymentType === "debit") {
                logger.info("Payment Type: " + paymentType);
            } else {
                logger.info("Payment Type: " + paymentType);
            }
            var total_amount = Donations.findOne(donation_id).total_amount;
            var customer_guid = Customers.findOne(customer_id).billy.customer_guid;
            logger.info("Donations ID: " + donation_id + " customer_guid: " + customer_guid);

            var resultSet = '';
            resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions", {
                params: {
				"customer_guid": customer_guid,
				"plan_guid": plan_guid,
				"funding_instrument_uri": "/" + Meteor.settings.balanced_uri + funding_instrument_uri,
				"appears_on_statement_as": "Trash Mountain",
                "amount": Math.ceil(total_amount), //TODO: run tests against this value to make sure it is always correct
                "started_at": started_date
			},
			auth: Meteor.settings.billy_key + ':'
		});
		if (resultSet.statusCode == 200) {
			logger.info("Subscription GUID: " + resultSet.data.guid);
			logger.info("Effective amount: " + resultSet.data.effective_amount);
			return resultSet;
		} else {
			var error = {};
			error.e = JSON.stringify(resultSet.data);
			error.id = id;
			failTheRecord(error);

			Meteor.error(resultSet.statusCode);
		}
		} catch (e) {
		 logger.error(e);
		 e._id = AllErrors.insert(e.response);
		 var error = {};
		 error.e = JSON.stringify(resultSet.data);
		 error.id = id;
		 failTheRecord(error);
		 throw new Meteor.Error(error, e._id);
		 }
	}
};

function throwTheError(e) {
	logger.error(JSON.stringify(e, null, 4));
    if(e.category_code) {
        throw new Meteor.Error(500, e.category_code, e.description);
    }else {
        throw new Meteor.Error(500, e.reason, e.details);
    }
	//throw new Meteor.Error(e);
}

function failTheRecord(data) {
  logger.error("Error for this ID: " + data.id);
  logger.error(JSON.stringify(data.e, null, 4));

      // Update this record to reflect failed status. 
      Donations.update(data.id, {
        $set: {
          failed: data.e
        }
      }); 
      return;
}

function getInvoice(subGUID) {
	try {
		logger.info("Started getInvoice");
		var resultSet = '';
		
		logger.info("inside getInvoice");
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
			auth: Meteor.settings.billy_key + ':'
		});
		return resultSet;
	} catch (e) {
		e._id = AllErrors.insert(e.response);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}

function getTransaction(invoiceID) {
	try {
		logger.info("Started getTransaction");
		var resultSet = '';
		resultSet = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoiceID + "/transactions", {
			auth: Meteor.settings.billy_key + ':'
		});
		return resultSet;
	} catch (e) {
		e._id = AllErrors.insert(e.response);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}

Meteor.methods({
    recurringDonation: function(data) {
		logger.info("Started billy method calls.");
		/*try {*/

			//Check the form to make sure nothing malicious is being submitted to the server
			Utils.checkFormFields(data);

			//Convert donation to more readable format
			var donateTo = Utils.getDonateTo(data.paymentInformation.donateTo);

            if(donateTo === 'Write In') {
                donateTo = data.paymentInformation.writeIn;
            }

			//initialize the balanced function with our API key.
			balanced.configure(Meteor.settings.balanced_api_key);

			//Take the form information, send it to customer insert and return the data back with the added customer information
			data.customer = Utils.create_customer(data.customer, true);

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
				'customer_id': data.customer._id,
                'start_date': data.paymentInformation.start_date,
                'later': data.paymentInformation.later,
                'is_recurring': data.paymentInformation.is_recurring
			});

			var billyPayment = {};
			billyPayment = Billy.createPaymentMethod(data.customer._id, data.paymentInformation.donateWith, data.paymentInformation.href, data.customer.billy.processor_uri);
			var billySubscribeCustomer = '';
			billySubscribeCustomer = Billy.subscribeToBillyPlan(data._id, data.customer._id, data.paymentInformation.type, data.paymentInformation.href);

			//Get the whole invoice if there is one
            if(!data.paymentInformation.later){
                var billyInvoice = {};
                billyInvoice = getInvoice(billySubscribeCustomer.data.guid);
                billyInvoice.data.items[0].subscription_guid = billySubscribeCustomer.data.guid;
                //push this invoice into the document
                /*Donations.update(data._id, {
                    $push: {
                        'invoices': billyInvoice.data.items[0]
                    }
                });*/
                logger.info("Inserted invoice into appropriate subscription.");

                //Get the whole Transaction
                var billyTransaction = {};
                billyTransaction = getTransaction(billyInvoice.data.items[0].guid);

                //update the collection with this transaction

                var transaction_email = {};
                transaction_email.transaction_guid = billyTransaction.data.items[0].guid;
                transaction_email.credit = {sent: false};

                var insertTransaction = billyTransaction.data.items[0];
                insertTransaction.debit_id = billyTransaction.data.items[0].processor_uri.replace('/debits/', '');

                Emails.insert(transaction_email);

                Donations.update(data._id, {
                    $push: {
                        'transactions': insertTransaction,
                        'invoices': billyInvoice.data.items[0],
                        'subscriptions': billySubscribeCustomer.data
                    }
                });

                //Construct the object to insert into the debits collection
                var insert_debit = Utils.get_debit(billyTransaction.data.items[0].processor_uri);
                console.log(data.customer._id);
                insert_debit._id = insert_debit.id;
                insert_debit.customer_id = data.customer._id;
                insert_debit.donation_id = data._id;
                insert_debit.transaction_guid = insert_debit.meta['billy.transaction_guid'];
                delete insert_debit.meta['billy.transaction_guid'];

                //Insert object into debits collection and get the _id
                if(!Debits.findOne(insert_debit.id)){
                    var debit_id = Debits.insert(insert_debit);
                }


                Meteor.setTimeout(function(){
                    Utils.post_donation_operation(data.customer._id, data._id,  insert_debit.id);
                }, 100);

                return {c: data.customer._id, don: data._id, deb: insert_debit.id};
            } else {
                Donations.update(data._id, {
                    $push: {
                        'subscriptions': billySubscribeCustomer.data
                    }
                });
                Meteor.setTimeout(function(){
                    Utils.post_donation_operation(data.customer._id, data._id, billySubscribeCustomer.data.guid);
                    console.log("Subscription guid: " + billySubscribeCustomer.data.guid);
                    Utils.send_scheduled_email(data._id, billySubscribeCustomer.data.guid);
                }, 100);


                return {c: data.customer._id, don: data._id, deb: 'scheduled'};
            }


		/*} catch (e) {
			logger.info(e);
			logger.info(e.error_message);
			logger.info(e.reason);
			throw new Meteor.Error(500, e.reason, e.details);
		}*/
	}
});