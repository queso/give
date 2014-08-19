var Future = Npm.require("fibers/future");
  function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
       fut.return(result);
     }, function (error) { 
       logger.info(error);      
       fut.throw(error);
    });
    return fut.wait();
  }
function throwTheError(e) {
	logger.error(JSON.stringify(error, null, 4));
	throw new Meteor.Error(error);
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
		var customerInfo = data.customer[0];
		var debitType = Donate.findOne(data._id).debit.type;
		logger.info("ID: " + data._id);
		logger.info("In create Payment Method before if: " + debitType);
		if (debitType === "card") {
			logger.info("Stepped into createPaymentMethod card if statment");
			
			// Start Tokenize card
			var card;
			logger.info("Payment info: " + JSON.stringify(data.paymentInformation[0]));
			card = extractFromPromise(balanced.marketplace.cards.create({
				"name": customerInfo.fname + " " + customerInfo.lname,
				'number': data.paymentInformation[0].card_number,
				'expiration_year': data.paymentInformation[0].expiry_year,
				'expiration_month': data.paymentInformation[0].expiry_month,
				'cvv': data.paymentInformation[0].cvv,
				"appears_on_statement_as": "Trash Mountain"
			}));
			logger.info("Card reponse from balanced: " + JSON.stringify(card));
			logger.info("ID passed from form is = " + data._id);

			logger.info("Adding card create response from Balanced to the collection.");
			Donate.update(data._id, {
				$set: {
					'card.fingerprint': card.fingerprint,
					'card.id': card.id,
					'card.type': card.type,
					'card.cvv_result': card.cvv_result,
					'card.number': card.number,
					'card.expiration_month': card.expiration_month,
					'card.expiration_year': card.expiration_year,
					'card.href': card.href,
					'card.bank_name': card.bank_name,
					'card.created_at': card.created_at,
					'card.can_debit': card.can_debit
				}
			});
			logger.info("Finished adding card into the collection.");

			logger.info("Started Debit Function.");
			var associate;
			var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
			var cardHref = card.href;
			logger.info("cardHref + processor_uri = " + cardHref + ' ' + processor_uri);
			logger.info("Started associating card with customer.");
			associate = extractFromPromise(balanced.get(cardHref).associate_to_customer(processor_uri));
			logger.info(JSON.stringify(associate));
			
			logger.info("Adding debit response from Balanced to the database");
			var debitResponse = Donate.update(data._id, {
				$set: {
					'debit.type': associate.type,
					'debit.customer': associate.links.customer,
					'debit.status': 'pending'
				}
			});
			return 'card';
		}
		//for running ACH
		else {
			logger.info("In check portion of create payment Method");
			//Create bank account
			var check;
			logger.info("Payment info: " + JSON.stringify(data.paymentInformation[0]));
			check = extractFromPromise(balanced.marketplace.bank_accounts.create({
				"routing_number": data.paymentInformation[0].routing_number,
				"account_type": data.paymentInformation[0].account_type,
				"name": customerInfo.fname + " " + customerInfo.lname,
				"account_number": data.paymentInformation[0].account_number,
				"appears_on_statement_as": "Trash Mountain"
			}));
			logger.info("Check: ");
			console.dir(JSON.stringify(check));
			logger.info("ID: " + data._id);
			//Debit function
			var associate;
			var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
			var checkHref = check.href;
			logger.info(checkHref + ' ' + processor_uri);
			logger.info("Associate uri: " + processor_uri);
			associate = extractFromPromise(balanced.get(checkHref).associate_to_customer(processor_uri));
			logger.info("Associate and debit: ");
			console.dir(JSON.stringify(associate));
			Donate.update(data._id, {
				$set: {
					'bank_account.id': check.id,
					'bank_account.href': check.href,
					'debit.customer': associate.links.customer,
					'debit.status': 'pending'
				}
			});
			return 'bank_accounts';
		}
	} catch (e) {
		throwTheError(e);
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
			auth: Meteor.settings.billyKey + ':'
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
			logger.info("Funding URI: " + funding_instrument_uri);
		} else {
			logger.info("Payment Type: " + paymentType);
			var funding_instrument_uri = Donate.findOne(data).bank_account.href;
			logger.info("Funding URI: " + funding_instrument_uri);
		}
		logger.info("Amount: " + (Donate.findOne(data).debit.total_amount * 100));
		var billyAmount = (Donate.findOne(data).debit.total_amount * 100);
		var resultSet = '';
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions", {
			//customer URI below is missing the last character, 'f' so that I can test errors
			params: {
				"customer_guid": Donate.findOne(data).recurring.customer.guid,
				"plan_guid": Meteor.settings.billyMonthlyGUID, //this is the monthly plan GUID
				//fix below
				"funding_instrument_uri": "/" + Meteor.settings.balancedPaymentsURI + funding_instrument_uri,
				"appears_on_statement_as": "Trash Mountain",
				"amount": billyAmount
			},
			auth: Meteor.settings.billyKey + ':'
		});
		if (resultSet.statusCode == 200) {
			logger.info(JSON.stringify(resultSet.data));
			logger.info("content: " + resultSet.content);
			logger.info("Subscription GUID: " + resultSet.data.guid);
			logger.info("Effective amount: " + resultSet.data.effective_amount);
			logger.info("statusCode: " + resultSet.statusCode);
			console.dir("data next invoice at: " + resultSet.data.next_invoice_at);
			return resultSet;
		} else {
			Meteor.error(resultSet.statusCode);
		}
	} catch (e) {
		logger.info(e);
		e._id = AllErrors.insert(e.response);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}

function getInvoice(subGUID) {
	try {
		logIt();
		logger.info("inside getInvoice");
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
			auth: Meteor.settings.billyKey + ':'
		});
		logger.info(resultSet.data);
		logger.info(resultSet.data.items[0].guid);
		return resultSet;
	} catch (e) {
		logger.info(e);
		e._id = AllErrors.insert(e.response);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}
Meteor.methods({
	/*createBillyPlan: function(data) {
		logIt();	
		this is the layout, need to convert this to HTTP.post instead of curl
		curl https://billy.balancedpayments.com/v1/plans \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "plan_type=debit" \
    -d "amount=500" \
    -d "frequency=monthly"
	},
	cancelBillySubscription: function(data) {
		logIt();
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/subscriptions/SU4ST39srWVLGbiTg174QyfF/cancel \
    -X POST \
    -u Meteor.settings.billyKey:
	},*/
	createCustomer: function(data) {
		logger.info("Started billy method calls.")
		logIt();
		balanced.configure(Meteor.settings.balancedPaymentsAPI);
		var customerInfo = data.customer[0];
		//remove before production
		logger.info("Customer Info: " + customerInfo);
		var customerData = '';
		try {
			customerData = extractFromPromise(balanced.marketplace.customers.create({
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
			//remove before production
			logger.info("Customer: ");
			console.dir(JSON.stringify(customerData));
			//Donate.update(data._id, {$set: {status: 'Customer created.'}});
			logger.info("Customer created: " + customerData.id);
			var customerResponse = Donate.update(data._id, {
				$set: {
					'customer.type': customerData._type,
					'customer.id': customerData.id
				}
			});
			var billyCustomer = '';
			billyCustomer = createBillyCustomer(customerData.id);
			logger.info("Customer GUID: " + JSON.stringify(billyCustomer.data));
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
			var billyPayment = '';
			billyPayment = createPaymentMethod(data);
			logger.info("Customer Payment Type: " + billyPayment);
			//Donate.update(data._id, {$set: {'recurring.payment': billyPayment.data}});
			var billySubscribeCustomer = '';
			logger.info("subscribe this mongo id: " + data._id);
			billySubscribeCustomer = subscribeToBillyPlan(data._id);
			logger.info("Subscription: " + billySubscribeCustomer.statusCode);
			Donate.update(data._id, {
				$set: {
					'recurring.subscription': billySubscribeCustomer.data
				}
			});
			var billyGetInvoiceID = '';
			billyGetInvoiceID = getInvoice(billySubscribeCustomer.data.guid);
			logger.info("Invoice id: " + billyGetInvoiceID.data.items[0].guid);
			Donate.update(data._id, {
				$set: {
					'recurring.invoice': billyGetInvoiceID.data
				}
			});
			return billySubscribeCustomer;
		} catch (e) {
			logger.info(e);
			logger.info(e.error_message);
			logger.info(e.reason);
			throw new Meteor.Error(e);
		}
	}
});