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

function logIt() {
	logger.info("Started " + arguments.callee.caller.name);
}

function createPaymentMethod(donation_id, customer_id, donateWith, href, processor_uri) {
	/*try {*/
		logIt();

		logger.info("In create Payment Method before if: " + donateWith);

	if (donateWith === "Card") {
		logger.info("Stepped into createPaymentMethod card if statement");

		//Get card URL
		var card = Utils.get_card(customer_id, href);

		logger.info("Finished adding card into the collection.");
		logger.info("Started Associate Function.");

		var associate = Utils.create_association(donation_id, card.href, processor_uri);

	}
        //for running ACH
    else
        {
            logger.info("In check portion of create payment Method");
            //Create bank account
            var check = Utils.get_check(customer_id, href);

			logger.info("Finished adding bank_account into the collection.");
			logger.info("Started Associate Function.");
            associate = Utils.create_association(donation_id, check.href, processor_uri);

        }
    /*}catch (e) {
        if(e.category_code) {
            logger.error("Category_code area: e.details " + e.details);
            throw new Meteor.Error(500, e.category_code, e.description);
        }else {
            logger.error("No category_code area: e.details " + e.details);
            throw new Meteor.Error(500, e.reason, e.details);
        }
		//throwTheError(e);
	}*/
}

function createBillyCustomer(customerID) {
	try {
		logIt();
		logger.info('Customer ID from balanced: ' + customerID);
		var resultSet = '';

		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
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

function subscribeToBillyPlan(donation_id, customer_id, paymentType, funding_instrument_uri) {
	/*try {*/
		logIt();

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
				"plan_guid": Meteor.settings.billy_monthly_GUID,
				"funding_instrument_uri": "/" + Meteor.settings.balanced_uri + funding_instrument_uri,
				"appears_on_statement_as": "Trash Mountain",
				"amount": Math.ceil(total_amount)
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
	/*} catch (e) {
		logger.error(e);
		e._id = AllErrors.insert(e.response);
		var error = {};
        error.e = JSON.stringify(resultSet.data);
        error.id = id;
        failTheRecord(error);
		throw new Meteor.Error(error, e._id);
	}*/
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
		logger.info("Started billy method calls.");
		logIt();
		/*try {*/

			//Check the form to make sure nothing malicious is being submitted to the server
	        Utils.checkFormFields(data);

			//Convert donation to more readable format
            var donateTo = Utils.getDonateTo(data.paymentInformation.donateTo);

            if(donateTo === 'Write In') {
                donateTo = data.paymentInformation.writeIn;
            }

			balanced.configure(Meteor.settings.balanced_api_key);
			var customerData = '';
		
			customerData = Utils.extractFromPromise(balanced.marketplace.customers.create({
				'name': data.customer.fname + " " + data.customer.lname,
				"address": {
					"city": data.customer.city,
					"state": data.customer.region,
					"line1": data.customer.address_line1,
					"line2": data.customer.address_line2,
					"postal_code": data.customer.postal_code
				},
				'email': data.customer.email_address,
				'phone': data.customer.phone_number
			}));

			data.customer.id = customerData.id;
			data.customer._type = customerData._type;

			var billyCustomer = {};
			billyCustomer = createBillyCustomer(customerData.id);

			var insertThis = {};
			insertThis = data.customer;
			insertThis.billy = {
				'created_at': billyCustomer.data.created_at,
				'customer_guid': billyCustomer.data.guid,
				'deleted': billyCustomer.data.deleted,
				'company_guid': billyCustomer.data.company_guid,
				'processor_uri': billyCustomer.data.processor_uri,
				'updated_at': billyCustomer.data.updated_at
			};
			var customer_id = Customers.insert(insertThis);

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
				'customer_id': customer_id,
				'status': 'pending'
			});

			var billyPayment = {};
			billyPayment = createPaymentMethod(data._id, customer_id, data.paymentInformation.donateWith, data.paymentInformation.href, billyCustomer.data.processor_uri);
			var billySubscribeCustomer = '';
			billySubscribeCustomer = subscribeToBillyPlan(data._id, customer_id, data.paymentInformation.type, data.paymentInformation.href);
			billySubscribeCustomer.data.balanced_customer_id = customerData.id;
			Donations.update(data._id, {
				$push: {
					'subscriptions': billySubscribeCustomer.data
				}
			});

			//Get the whole invoice
			var billyInvoice = {};
			billyInvoice = getInvoice(billySubscribeCustomer.data.guid);
			billyInvoice.data.items[0].subscription_guid = billySubscribeCustomer.data.guid;
			//push this invoice into the document
			Donations.update(data._id, {
				$push: {
					'invoices': billyInvoice.data.items[0]
				}
			});
			logger.info("Inserted invoice into appropriate subscription.");


			//Get the whole Transaction
			var billyTransaction = {};
			billyTransaction = getTransaction(billyInvoice.data.items[0].guid);

			//update the collection with this transaction

            var transaction_email = {};
			transaction_email.transaction_guid = billyTransaction.data.items[0].guid;
			transaction_email.credit = {sent: false};

            var transaction_guid = billyTransaction.data.items[0].guid;

			Emails.insert(transaction_email);

            Donations.update(data._id, {
            	$push: {
            		'transactions': billyTransaction.data.items[0]
            	}
            });

			var return_this = {_id: data._id, transaction_guid: transaction_guid};
			return return_this;


		/*} catch (e) {
			logger.info(e);
			logger.info(e.error_message);
			logger.info(e.reason);
			throw new Meteor.Error(500, e.reason, e.details);
		}*/
	}
});