Meteor.methods({
	createBillyCustomer: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href*/
	},
	createBillyPlan: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/plans \
    -X POST \
    -u 5MyxREWaEymNWunpGseySVGBZkTWDW57FUXsyTo2WtGC: \
    -d "plan_type=debit" \
    -d "amount=500" \
    -d "frequency=monthly"*/
	},
	subscribeToBillyPlan: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/subscriptions \
    -X POST \
    -u 5MyxREWaEymNWunpGseySVGBZkTWDW57FUXsyTo2WtGC: \
    -d "customer_guid=CU4NheTMcQqXgmAtg1aGTJPK" \
    -d "plan_guid=PL4RHCKW7GsGMjpcozHveQuw" \
    -d "funding_instrument_uri=/v1/marketplaces/TEST-MP6lD3dBpta7OAXJsN766qA/cards/CCBXYdbpYDwX68hv69UH1eS"
    -d "amount=350"*/
	},
	createBillyCustomer: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href*/
	},
	cancelBillySubscription: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/subscriptions/SU4ST39srWVLGbiTg174QyfF/cancel \
    -X POST \
    -u 5MyxREWaEymNWunpGseySVGBZkTWDW57FUXsyTo2WtGC:*/
	}
});