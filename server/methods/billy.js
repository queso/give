var Future = Npm.require("fibers/future");
  function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
       fut.return(result);
     }, function (error) { 
       console.log(error);      
       fut.throw(error);
    });
    return fut.wait();
  }
function throwTheError(e) {
	console.log("Extras: " + JSON.parse(e.message).errors[0].extras);
	console.log("Category Code: " + JSON.parse(e.message).errors[0].category_code);
	console.log("All Errors: " + JSON.parse(e.message).errors[0]);
	var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
	logger.error(JSON.stringify(error, null, 4));
	throw new Meteor.Error(error);
}

function createPaymentMethod(data) {
	try {
		// Setup variables for data from form inputs
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
				}
			});
			return 'card';
		}
		//for running ACH
		else {
			console.log("In check portion of create payment Method");
			//Create bank account
			var check;
			console.log("Payment info: " + JSON.stringify(data.paymentInformation[0]));
			check = extractFromPromise(balanced.marketplace.bank_accounts.create({
				"routing_number": data.paymentInformation[0].routing_number,
				"account_type": data.paymentInformation[0].account_type,
				"name": customerInfo.fname + " " + customerInfo.lname,
				"account_number": data.paymentInformation[0].account_number,
				"appears_on_statement_as": "Trash Mountain"
			}));
			console.log("Check: ");
			console.dir(JSON.stringify(check));
			console.log("ID: " + data._id);
			//Debit function
			var associate;
			var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
			var checkHref = check.href;
			console.log(checkHref + ' ' + processor_uri);
			console.log("Associate uri: " + processor_uri);
			associate = extractFromPromise(balanced.get(checkHref).associate_to_customer(processor_uri));
			console.log("Associate and debit: ");
			console.dir(JSON.stringify(associate));
			Donate.update(data._id, {
				$set: {
					'bank_account.id': check.id,
					'bank_account.href': check.href,
					'debit.customer': associate.links.customer
				}
			});
			return 'bank_accounts';
		}
	} catch (e) {
		throwTheError(e);
	}
}

function createBillyCustomer(customerID) {
	console.log('Customer ID from balanced: ' + customerID);
	var resultSet = '';
	try {
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
			//customer URI below is missing the last character, 'f' so that I can test errors
			params: {
				"processor_uri": "/customers/" + customerID
			},
			auth: Meteor.settings.billyKey + ':'
		});
		console.log(resultSet.data.company_guid);
		return resultSet;
	} catch (e) {
		console.log(e);
		e._id = AllErrors.insert(e);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}

function subscribeToBillyPlan(data) {
	var paymentType = Donate.findOne(data).debit.type;
	if (paymentType === "credit" || paymentType === "debit") {
		console.log("Payment Type: " + paymentType);
		var funding_instrument_uri = Donate.findOne(data).card.href;
		console.log("Funding URI: " + funding_instrument_uri);
	} else {
		console.log("Payment Type: " + paymentType);
		var funding_instrument_uri = Donate.findOne(data).bank_account.href;
		console.log("Funding URI: " + funding_instrument_uri);
	}
	console.log("Amount: " + (Donate.findOne(data).debit.total_amount * 100));
	var billyAmount = (Donate.findOne(data).debit.total_amount * 100);
	var resultSet = '';
	try {
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
			console.log(JSON.stringify(resultSet.data));
			console.log("content: " + resultSet.content);
			console.log("Subscription GUID: " + resultSet.data.guid);
			console.log("Effective amount: " + resultSet.data.effective_amount);
			console.log("statusCode: " + resultSet.statusCode);
			console.dir("data next invoice at: " + resultSet.data.next_invoice_at);
			return resultSet;
		} else {
			Meteor.error(resultSet.statusCode);
		}
	} catch (e) {
		console.log(e);
		e._id = AllErrors.insert(e.response);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}

function getInvoice(subGUID) {
	try {
		console.log("inside getInvoice");
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
			auth: Meteor.settings.billyKey + ':'
		});
		console.log(resultSet.data);
		console.log(resultSet.data.items[0].guid);
		return resultSet;
	} catch (e) {
		console.log(e);
		e._id = AllErrors.insert(e.response);
		var error = (e.response);
		throw new Meteor.Error(error, e._id);
	}
}
Meteor.methods({
	testBillyFunction: function(dataFromOther) {
		var resultSet = '';
		try {
			resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
				//customer URI below is missing the last character, 'f' so that I can test errors
				params: {
					"processor_uri": "/customers/CU7Jy94eIBTFFE1h2JiPuaZn"
				},
				auth: Meteor.settings.billyKey + ':'
			});
			console.log(resultSet.data.company_guid);
			return resultSet;
		} catch (e) {
			e._id = AllErrors.insert(e.response);
			var error = (e.response);
			throw new Meteor.Error(error, e._id);
		}
	},
	testBillyFunctionForReal: function(data) {
			var resultSet = '';
			resultSet = createBillyCustomer(data);
			console.log(resultSet);
		}
		/*,
	createBillyCustomer: function (data) {
    var resultSet = '';

		resultSet = HTTP.post(
		"https://billy.balancedpayments.com/v1/customers",{
		params: {"processor_uri": '/customers/' + data.customer.id},
		auth: Meteor.settings.billyKey + ':'
	});

    

		//this is the layout, need to convert this to HTTP.post instead of curl
		//POST request looks like this. basic authentication with the the billyKey
		//body processor_uri=data.customer.href
		//content-type:application/x-www-form-urlencoded
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href
	}*/
		,
	createBillyPlan: function(data) {
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/plans \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "plan_type=debit" \
    -d "amount=500" \
    -d "frequency=monthly"*/
	},
	cancelBillySubscription: function(data) {
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/subscriptions/SU4ST39srWVLGbiTg174QyfF/cancel \
    -X POST \
    -u Meteor.settings.billyKey:*/
	},
	createCustomer: function(data) {
		//Donate.update(data._id, {$set: {status: 'Creating Customer'}});
		balanced.configure(Meteor.settings.balancedPaymentsAPI);
		var customerInfo = data.customer[0];
		//remove before production
		console.log("Customer Info: " + customerInfo);
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
			console.log("Customer: ");
			console.dir(JSON.stringify(customerData));
			//Donate.update(data._id, {$set: {status: 'Customer created.'}});
			console.log("Customer created: " + customerData.id);
			var customerResponse = Donate.update(data._id, {
				$set: {
					'customer.type': customerData._type,
					'customer.id': customerData.id
				}
			});
			var billyCustomer = '';
			billyCustomer = createBillyCustomer(customerData.id);
			console.log("Customer GUID: " + JSON.stringify(billyCustomer.data));
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
			console.log("Customer Payment Type: " + billyPayment);
			//Donate.update(data._id, {$set: {'recurring.payment': billyPayment.data}});
			var billySubscribeCustomer = '';
			console.log("subscribe this mongo id: " + data._id);
			billySubscribeCustomer = subscribeToBillyPlan(data._id);
			console.log("Subscription: " + billySubscribeCustomer.statusCode);
			Donate.update(data._id, {
				$set: {
					'recurring.subscription': billySubscribeCustomer.data
				}
			});
			var billyGetInvoiceID = '';
			billyGetInvoiceID = getInvoice(billySubscribeCustomer.data.guid);
			console.log("Invoice id: " + billyGetInvoiceID.data.items[0].guid);
			Donate.update(data._id, {
				$set: {
					'recurring.invoice': billyGetInvoiceID.data
				}
			});
			return billySubscribeCustomer;
		} catch (e) {
			console.log(e);
			console.log(e.error_message);
			console.log(e.reason);
			throw new Meteor.Error(e);
		}
	}
});