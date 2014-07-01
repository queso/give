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
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href - the cutomer href, check on this, because it might have to include the uri with the marketplace as well*/
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
	subscribeToBillyPlan: function (data) {
		
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

	}
});