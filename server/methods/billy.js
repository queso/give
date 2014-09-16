var Future = Meteor.npmRequire("fibers/future");
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
	logger.error(JSON.stringify(e, null, 4));
	throw new Meteor.Error(e);
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
		var debitType = data.paymentInformation[0].type;
		logger.info("ID: " + data._id);
		logger.info("In create Payment Method before if: " + debitType);

    var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
    if (debitType === "card") {
        logger.info("Stepped into createPaymentMethod card if statement");

        //Tokenize card
        var card = Utils.card_create(data);
        /*, function (error, result) {
         console.log(error);
         console.log(result);

         if (result) {
         card = result;
         console.log("Card: ");
         console.dir(JSON.stringify(card));
         console.log("Adding card create response from Balanced to the collection.");
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
         }
         });*/
        logger.info("Finished adding card into the collection.");
        logger.info("Started Associate Function.");
        var cardHref = card.href;
        var associate = Utils.create_association(data, cardHref, processor_uri);
        /* function(error, result){
         console.log("Results from create_association call: ");
         console.dir(error, result);
         if(result){
         associate = result;
         console.log("Card links: " + card.links);
         Donate.update(data._id, {
         $set: {
         'debit.type': associate.type,

         'debit.status': 'pending'
         }
         });
         }
         });
         return 'card';
         */}
        //for running ACH
    else
        {
            logger.info("In check portion of create payment Method");
            //Create bank account
            var check = Utils.check_create(data);
            /* function (error, result) {
             console.log(error);
             console.log(result);
             if (result) {
             check = result;
             console.log("Check: ");
             console.dir(JSON.stringify(check));
             console.log("Adding check create response from Balanced to the collection.");
             Donate.update(data._id, {
             $set: {
             'bank_account.id': check.id,
             'bank_account.href': check.href}
             });
             }
             });*/

            var checkHref = check.href;
            associate = Utils.create_association(data, checkHref, processor_uri);
            /*, function(error, result){
             console.log(error, result);
             if(result){
             associate = result;
             console.log("Associate links: " + associate.links);
             Donate.update(data._id, {
             $set: {
             'debit.type': associate.type,
             'debit.customer': check.links.customer,
             'debit.status': 'pending'
             }
             });
             }
             });
             return 'bank_accounts';
             }*/
        }
    }catch (e) {
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
		logger.info("inside getInvoice");
		resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + subGUID + "/invoices", {
			auth: Meteor.settings.billyKey + ':'
		});
		logger.info("getInvoice " + resultSet.data);
		logger.info("getInvoice " + resultSet.data.items[0].guid);
		return resultSet;
	} catch (e) {
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
    recurringDonation: function(data) {
		logger.info("Started billy method calls.")
		logIt();
		// Moved the below from client side to here.  
      	data._id = Donate.insert({created_at: data.paymentInformation[0].created_at});
		console.log(data);

		console.log(data._id);

		Donate.update(data._id, {
			$set: {
				sessionId: data.sessionId,
				URL: data.URL,
				'customer': data.customer[0],
				'debit.donateTo': data.paymentInformation[0].donateTo,
				'debit.donateWith': data.paymentInformation[0].donateWith,
				'debit.email_sent': false,
				'debit.type': data.paymentInformation[0].type,
				'debit.total_amount': data.paymentInformation[0].total_amount,
				'debit.amount': data.paymentInformation[0].amount,
				'debit.fees': data.paymentInformation[0].fees,
				'debit.coveredTheFees': data.paymentInformation[0].coverTheFees,
                'debit.status': 'pending'
			}
		});

		balanced.configure(Meteor.settings.balancedPaymentsAPI);
		var customerInfo = data.customer[0];
		//remove before production
		logger.info("Customer Info: " + customerInfo);
		logger.info("Customer First Name: " + customerInfo.fname);
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
			var customerResponse = Donate.update(data._id, {
				$set: {
					'customer.type': customerData._type,
					'customer.id': customerData.id
				}
			});
			var billyCustomer = '';
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
			var billyPayment = '';
			billyPayment = createPaymentMethod(data);
			var billySubscribeCustomer = '';
			billySubscribeCustomer = subscribeToBillyPlan(data._id);
			Donate.update(data._id, {
				$set: {
					'recurring.subscription': billySubscribeCustomer.data
				}
			});
			var billyGetInvoiceID = '';
			billyGetInvoiceID = getInvoice(billySubscribeCustomer.data.guid);
			Donate.update(data._id, {
				$set: {
					'recurring.invoice': billyGetInvoiceID.data
				}
			});
			return data._id;
		} catch (e) {
			logger.info(e);
			logger.info(e.error_message);
			logger.info(e.reason);
			throw new Meteor.Error(e);
		}
	}
});