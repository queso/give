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
      Donate.update(data.id, {
        $set: {
          failed: data.e
        }
      }); 
      return;
}

function logIt() {
	logger.info("Started " + arguments.callee.caller.name);
}

function createPaymentMethod(data) {
	try {
		logIt();

		logger.info("Setup variables for data from form inputs inside the billy createPaymentMethod method.");
		var customerInfo = data.customer;
		var debitType = data.paymentInformation.type;
		logger.info("ID: " + data._id);
		logger.info("In create Payment Method before if: " + debitType);

    var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
    if (debitType === "Card") {
        logger.info("Stepped into createPaymentMethod card if statement");

        //Tokenize card
        var card = Utils.card_create(data);


        logger.info("Finished adding card into the collection.");
        logger.info("Started Associate Function.");

        var associate = Utils.create_association(data, card.href, processor_uri);

    }
        //for running ACH
    else
        {
            logger.info("In check portion of create payment Method");
            //Create bank account
            var check = Utils.check_create(data);


            associate = Utils.create_association(data, check.href, processor_uri);

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
}

function createBillyCustomer(customerID) {
	try {
		logIt();
		logger.info('Customer ID from balanced: ' + customerID);
		var resultSet = '';

		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
			//customer URI below is missing the last character, 'f' so that I can test errors
			params: {
				"processor_uri": "/customers/" + customerID
			},
			auth: Meteor.settings.billy_key + ':'
		});
		logger.info(resultSet.data.company_guid);
		return resultSet;
	} catch (e) {
		logger.info(e);
		e._id = AllErrors.insert(e);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}

function subscribeToBillyPlan(data) {
	try {
		logIt();
		var paymentType = Donate.findOne(data).debit.type;
		if (paymentType === "credit" || paymentType === "debit") {
			logger.info("Payment Type: " + paymentType);
			var funding_instrument_uri = Donate.findOne(data).card.href;
		} else {
			logger.info("Payment Type: " + paymentType);
			var funding_instrument_uri = Donate.findOne(data).bank_account.href;
		}
		logger.info("Amount: " + Math.ceil(Donate.findOne(data).debit.total_amount));
		var billyAmount = Math.ceil(Donate.findOne(data).debit.total_amount);
		var resultSet = '';
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions", {
			params: {
				"customer_guid": Donate.findOne(data).recurring.customer.guid,
				"plan_guid": Meteor.settings.billy_monthly_GUID,
				"funding_instrument_uri": "/" + Meteor.settings.balanced_uri + funding_instrument_uri,
				"appears_on_statement_as": "Trash Mountain",
				"amount": billyAmount
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
            error.id = data._id;
            failTheRecord(error);

			Meteor.error(resultSet.statusCode);
		}
	} catch (e) {
		logger.error(e);
		e._id = AllErrors.insert(e.response);
		var error = {};
        error.e = JSON.stringify(resultSet.data);
        error.id = data._id;
        failTheRecord(error);
		throw new Meteor.Error(error, e._id);
	}
}

function getInvoice(subGUID) {
	try {
		logIt();
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
		logIt();
		var resultSet = '';

		logger.info("inside getTransaction");
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
		logger.info("Started billy method calls.")
		logIt();
		try {

			//Check the form to make sure nothing malicious is being submitted to the server
	        Utils.checkFormFields(data);

			// Moved the below from client side to here.  
	      	data._id = Donate.insert({created_at: data.paymentInformation.created_at});

			Donate.update(data._id, {
				$set: {
					sessionId: data.sessionId,
					URL: data.URL,
					'customer': data.customer,
					'debit.donateTo': data.paymentInformation.donateTo,
					'debit.donateWith': data.paymentInformation.donateWith,
					'debit.type': data.paymentInformation.type,
					'debit.total_amount': data.paymentInformation.total_amount,
					'debit.amount': data.paymentInformation.amount,
					'debit.fees': data.paymentInformation.fees,
					'debit.coveredTheFees': data.paymentInformation.coverTheFees,
	                'debit.status': 'pending',
                    'viewable': true
				}
			});
			logger.info("ID: " + data._id);

			balanced.configure(Meteor.settings.balanced_api_key);
			var customerInfo = data.customer;
			var customerData = '';
		
			customerData = Utils.extractFromPromise(balanced.marketplace.customers.create({
				'name': customerInfo.fname + " " + customerInfo.lname,
				"address": {
					"city": customerInfo.city,
					"state": customerInfo.region,
					"line1": customerInfo.address_line1,
					"line2": customerInfo.address_line2,
					"postal_code": customerInfo.postal_code,
				},
				'email': customerInfo.email_address,
				//need to add if statement for any fields that might be blank
				'phone': customerInfo.phone_number
			}));
			var customerResponse = Donate.update(data._id, {
				$set: {
					'customer.type': customerData._type,
					'customer.id': customerData.id
				}
			});
			var billyCustomer = {};
			billyCustomer = createBillyCustomer(customerData.id);
			Donate.update(data._id, {
				$set: {
					'recurring.customer': billyCustomer.data
				}
			});
			Donate.update(data._id, {
				$set: {
					'recurring.isRecurring': true
				}
			});
			var billyPayment = {};
			billyPayment = createPaymentMethod(data);
			var billySubscribeCustomer = '';
			billySubscribeCustomer = subscribeToBillyPlan(data._id);
			Donate.update(data._id, {
				$set: {
					'recurring.subscriptions': billySubscribeCustomer.data
				}
			});
			//Copy debit information into the subscription
			var debitInformation = Donate.findOne(data._id).debit;
			debitInformation.subscription_guid = billySubscribeCustomer.data.guid;
			Donate.update({_id: data._id},
				{
				$set: {
					'recurring.subscriptions.debitInformation': debitInformation
				}
			});
			


			var billyGetInvoiceID = {};
			billyGetInvoiceID = getInvoice(billySubscribeCustomer.data.guid);

			//update the collection with this invoice
	        var invoice_guid = billyGetInvoiceID.data.items[0].guid;
	        var setModifier = { $set: {} };
	        setModifier.$set['recurring.invoices.' + invoice_guid] = billyGetInvoiceID.data.items[0]
	        Donate.update({_id: data._id}, setModifier);
			logger.info("Inserted invoice into appropriate subscription.");

			var billyGetTransactionID = {};
			billyGetTransactionID = getTransaction(billyGetInvoiceID.data.items[0].guid);

			//update the collection with this transaction
			var transaction_guid = billyGetTransactionID.data.items[0].guid;
			var setModifier = { $set: {} };
            billyGetTransactionID.data.items[0].email_sent = {};
            setModifier.$set['recurring.transactions.' + transaction_guid] = billyGetTransactionID.data.items[0];
            Donate.update({_id: data._id}, setModifier);

			var return_this = {_id: data._id, transaction_guid: transaction_guid};
			//return data._id;
			return return_this;


		} catch (e) {
			logger.info(e);
			logger.info(e.error_message);
			logger.info(e.reason);
			throw new Meteor.Error(500, e.reason, e.details);
		}
	}
});