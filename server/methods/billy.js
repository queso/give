Meteor.methods({
	createBillyCustomer: function (data) {
		
    var result = extractFromPromise(HTTP.post(
    	"https://billy.balancedpayments.com/v1/customers",{
	    	auth: Meteor.settings.billyKey, 
	    	params: {"processor_uri": 'CU5TULDo1gF4aVQKLZKBad4p'}
	}));
    console.log(result);
    return result;
    

		//this is the layout, need to convert this to HTTP.post instead of curl
		//POST request looks like this. basic authentication with the the billyKey
		//body processor_uri=data.customer.href
		//content-type:application/x-www-form-urlencoded
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href*/
	},
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
	createBillyCustomer: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href - the cutomer href, check on this, because it might have to include the uri with the marketplace as well*/
	},
	cancelBillySubscription: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/subscriptions/SU4ST39srWVLGbiTg174QyfF/cancel \
    -X POST \
    -u Meteor.settings.billyKey:*/
	}
});