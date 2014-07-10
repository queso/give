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

	function createPaymentMethod(data) {
		console.log("ID: " + data._id);
			var debitType = Donate.findOne(data._id).debit.type;
			console.log("In create Payment Method before if: " + debitType);
		if (debitType === "card") {
			console.log("In createPaymentMethod card portion");
	        //Tokenize card
	        var card;
	        try {
	          card = extractFromPromise(balanced.marketplace.cards.create({
	            'number': data.paymentInformation[0].card_number,
	            'expiration_year': data.paymentInformation[0].expiry_year,
	            'expiration_month': data.paymentInformation[0].expiry_month,
	            'cvv': data.paymentInformation[0].cvv
	          }));
	          console.log("Card: ");
	          console.log(JSON.stringify(card));
	          console.log("ID: " + data._id);
	          
	          //add card create response from Balanced to the database
	        Donate.update(data._id, {$set: {'card.fingerprint': card.fingerprint,
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
	      	}});
	          console.log("Added card into collection");
	        } 
	        catch (e) {
	            console.log(JSON.parse(e.message).errors[0].extras);  
	            console.log(JSON.parse(e.message).errors[0].category_code);            
	            var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
	            throw new Meteor.Error(error.category_code, error.status_code, error.description, error.extras);
	        }
	        //Debit function
          var associate;
          try {
          	var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
          	var cardHref = card.href;
          	console.log(cardHref + ' ' + processor_uri);
            associate = extractFromPromise(balanced.get(cardHref).associate_to_customer(processor_uri));
            console.log("Associate and debit: ");
            console.dir(JSON.stringify(associate));
          }
          catch (e) {
            console.log(JSON.parse(e.message).errors[0].extras);  
            console.log(JSON.parse(e.message).errors[0].category_code);            
            var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
            throw new Meteor.Error(error.category_code, error.status_code, error.description, error.extras);
          }
	    
		//add debit response from Balanced to the database
        var debitReponse = Donate.update(data._id, {$set: {
          'debit.type':   associate.type,
          'debit.customer': associate.links.customer,
          'debit.id': associate.id
        }});    
        return 'card';
	}

        //for running ACH
        else {
          console.log("In check portion of create payment Method");
          //Create bank account
          var check;
          try {
            check = extractFromPromise(balanced.marketplace.bank_accounts.create({
              "routing_number": data.paymentInformation[0].routing_number, 
              "account_type": data.paymentInformation[0].account_type, 
              "name": customerInfo.fname + " " + customerInfo.lname, 
              "account_number": data.paymentInformation[0].account_number,
              "appears_on_statement_as": "Trash Mountain"
            }));
            console.log("Check: ");
            console.dir(JSON.stringify(check));

            
          
          }
          catch (e) {
            console.log(JSON.parse(e.message).errors[0].extras);            
            var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
            throw new Meteor.Error(error.status_code, error.description, error.extras);
          }
          //Debit function
          var associate;
          try {
          	console.log("Associate uri: " + data.recurring.data.processor_uri);
            associate = extractFromPromise(check.associate_to_customer(data.recurring.data.processor_uri)({
            "appears_on_statement_as": "Trash Mountain"}));
            console.log("Associate and debit: ");
            console.dir(JSON.stringify(associate));

            //add check create response from Balanced to the database
	        /*var checkResponse = Donate.update(data._id, {$set: {
	          'bank_account.type': check._type,
	          'bank_account.id': check.id,
	          'debit.type':   associate.type,
	          'debit.customer': associate.links.customer,
	          'debit.id': associate.id
	        }}); */
			
			//add debit response from Balanced to the database
		    var debitReponse = Donate.update(data._id, {$set: {
	          'bank_account.type': check._type,
	          'bank_account.id': check.id,	
	          'debit.type':   associate.type,
	          'debit.customer': associate.links.customer,
	          //'debit.total_amount': associate.amount / 100,
	          'debit.id': associate.id
	        }});    
	
	        return 'bank_accounts';
	        
          }
          catch (e) {
            console.log(JSON.parse(e.message).errors[0].extras);  
            console.log(JSON.parse(e.message).errors[0].category_code);            
            var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
            throw new Meteor.Error(error.category_code, error.status_code, error.description, error.extras);
          }
	    
	}
}

  function createBillyCustomer(customerID) {
  	console.log('Customer ID from balanced: ' + customerID);
		var resultSet = '';
		try {
			resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
				//customer URI below is missing the last character, 'f' so that I can test errors
				params: {"processor_uri": "/customers/" + customerID},
				auth: Meteor.settings.billyKey + ':'
			});
			
			console.log(resultSet.data.company_guid); 
			return resultSet;
		} catch (e) {
			e._id = AllErrors.insert(e.response);
		    var error = (e.response);
		    throw new Meteor.Error(error, e._id);
		}
	}

	function subscribeToBillyPlan(data) {
		var paymentType = Donate.findOne(data).debit.type;

		if (paymentType == "credit") {
			console.log("Payment Type: " + paymentType);
			var funding_instrument_uri = Donate.findOne(data).card.href;
		} else {
			console.log("Payment Type: " + paymentType);
			var funding_instrument_uri = Donate.findOne(data).bank_accounts.href;
		}
		
		console.log("Amount: " + (Donate.findOne(data).debit.total_amount * 100));
		var billyAmount = (Donate.findOne(data).debit.total_amount * 100);
		var resultSet = '';
		/*try {*/
			resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions", {
				//customer URI below is missing the last character, 'f' so that I can test errors
				params: {"customer_guid": Donate.findOne(data).recurring.customer.guid,
						"plan_guid": "PLHhZ2sD5AyTzy2m3oV1WsTs",//this is the daily plan GUID
						//fix below
						"funding_instrument_uri": "/v1/marketplaces/TEST-MP2YcEwiMjhT1jmtW33ptC6N" + funding_instrument_uri,
						"appears_on_statement_as": "Trash Mountain",
						"amount": billyAmount},						
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
/*		} catch (e) {
			e._id = AllErrors.insert(e.response);
		    var error = (e.response);
		    throw new Meteor.Error(error, e._id);
		}*/
		//this is the layout, need to convert this to HTTP.post instead of curl
		//this plan has the amount, which uses a plan that is already setup, but since the amount is included
		// the plan amount is overritten. 
		/*curl https://billy.balancedpayments.com/v1/subscriptions \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "customer_guid=CU4NheTMcQqXgmAtg1aGTJPK" \
    -d "plan_guid=PL4RHCKW7GsGMjpcozHveQuw" \
    -d "funding_instrument_uri=/v1/marketplaces/TEST-MP6lD3dBpta7OAXJsN766qA/cards/CCBXYdbpYDwX68hv69UH1eS"
    -d "amount=350"*/
    //POST request looks like this. basic authentication with the the billyKey
	//content-type:application/x-www-form-urlencoded
    //BODY is normal query string, for example amount=350&customer_guid=CU4NheTMcQqXgmAtg1aGTJPK"
	}
Meteor.methods({
	testBillyFunction: function (dataFromOther) {
		var resultSet = '';
		try {
			resultSet = HTTP.post("https://billy.balancedpayments.com/v1/customers", {
				//customer URI below is missing the last character, 'f' so that I can test errors
				params: {"processor_uri": "/customers/CU7Jy94eIBTFFE1h2JiPuaZn"},
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
	testBillyFunctionForReal: function (data) {
		var resultSet = '';
		resultSet = createBillyCustomer(data);
		console.log(resultSet);
	}/*,
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
	}*/,
	createBillyPlan: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/plans \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "plan_type=debit" \
    -d "amount=500" \
    -d "frequency=monthly"*/
	},

	cancelBillySubscription: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/subscriptions/SU4ST39srWVLGbiTg174QyfF/cancel \
    -X POST \
    -u Meteor.settings.billyKey:*/
	},
	createCustomer: function (data) {
		//Donate.update(data._id, {$set: {status: 'Creating Customer'}});

		balanced.configure(Meteor.settings.balancedPaymentsAPI);
		var customerInfo = data.customer[0];

		//remove before production
		console.log("Customer Info: " + customerInfo);

		var customerData = '';

		try {
		customerData =  extractFromPromise(balanced.marketplace.customers.create({
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

		var customerResponse = Donate.update(data._id, {$set: {
            'customer.type': customerData._type,
            'customer.id': customerData.id
          }});
		if (data.pass) {
			var billyCustomer = ''; 
			billyCustomer = createBillyCustomer(customerData.id);
			console.log("Customer GUID: " + JSON.stringify(billyCustomer.data));
			Donate.update(data._id, {$set: {'recurring.customer': billyCustomer.data}});

			var billyPayment = ''; 
			billyPayment = createPaymentMethod(data);
			console.log("Customer Payment Type: " + billyPayment);
			//Donate.update(data._id, {$set: {'recurring.payment': billyPayment.data}});

			var billySubscribeCustomer = '';
			console.log("subscribe id: " + data._id);
			billySubscribeCustomer = subscribeToBillyPlan(data._id);
			console.log("Subscription: " + billySubscribeCustomer.statusCode);
			Donate.update(data._id, {$set: {'recurring.subscription': billySubscribeCustomer.data}});

			return billySubscribeCustomer;

            /*if (error) {
              //remove below before production 
              console.log(error.error.data.error_class);
              console.log(error.error.data.error_message);
              console.log(error.reason);
            } else {
              //remove below before production 
            console.log(" Result: " + result.data.guid);
            //console.log(" Full result: " + JSON.stringify(result));
            console.log(" Result: " + JSON.stringify(result));
            console.log(" Result: " + result.create_at);
            console.log(" Result: " + result);
            return result; //.data.guid;*/
		} else {
			return;
		}
		} catch (e) {
		//console.log(JSON.parse(e.message).errors[0].extras);  
		//console.log(JSON.parse(e.message).errors[0].category_code);            
		//var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
		console.log(e);
		//throw new Meteor.Error(error.category_code, error.status_code, error.description, error.extras);
		}

	}/*,
	createCustomerAsync: function (data) {

		balanced.configure(Meteor.settings.balancedPaymentsAPI);
		var customerInfo = data.customer[0];

		//remove before production
		console.dir(JSON.stringify(customerInfo));

		var customerData = '';

		try {
		customerData =  Async.runSync(function (done){
			balanced.marketplace.customers.create({
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
			});
              done(null);
		});
		//remove before production
		console.log("Customer Aysnc Data: ");
		console.dir(JSON.stringify(customerData));
		//Donate.update(data._id, {$set: {status: 'Customer created.'}});
		console.log("Customer created: " + customerData.id);

		var customerResponse = Donate.update(data._id, {$set: {
            'customer.type': customerData._type,
            'customer.id': customerData.id
          }});
		if (data.pass) {
			var billyCustomer = ''; 
			billyCustomer = createBillyCustomer(customerData.id);

			return billyCustomer.data.guid;

            /*if (error) {
              //remove below before production 
              console.log(error.error.data.error_class);
              console.log(error.error.data.error_message);
              console.log(error.reason);
            } else {
              //remove below before production 
            console.log(" Result: " + result.data.guid);
            //console.log(" Full result: " + JSON.stringify(result));
            console.log(" Result: " + JSON.stringify(result));
            console.log(" Result: " + result.create_at);
            console.log(" Result: " + result);
            return result; //.data.guid;
		} else {
			return;
		}
		} catch (e) {
		//console.log(JSON.parse(e.message).errors[0].extras);  
		//console.log(JSON.parse(e.message).errors[0].category_code);            
		//var error = JSON.parse(e.message).errors[0]; // Update this to handle multiple errors?
		console.log(e);
		//throw new Meteor.Error(error.category_code, error.status_code, error.description, error.extras);
		}

	}*/
});