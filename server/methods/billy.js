Meteor.methods({
	createBillyCustomer: function (data) {
		
		//this is the layout, need to convert this to HTTP.post instead of curl
		/*curl https://billy.balancedpayments.com/v1/customers \
    -X POST \
    -u Meteor.settings.billyKey: \
    -d "processor_uri=" + data.customer.href*/
	}
});