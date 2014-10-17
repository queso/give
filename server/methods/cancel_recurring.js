Meteor.methods({
	cancel_recurring: function(id, guid) {
		logger.info("Started the cancel_recurring method call");
		var resultSet;
		var getSubscription;

		getSubscription = HTTP.get("https://billy.balancedpayments.com/v1/subscriptions/" + guid ,{ auth: Meteor.settings.billy_key + ':'});

		if(getSubscription && getSubscription.data.canceled !== true){
			logger.info("getSubscription.data.canceled = " + getSubscription.data.canceled);		
			resultSet = HTTP.post("https://billy.balancedpayments.com/v1/subscriptions/" + guid + "/cancel/" , { auth: Meteor.settings.billy_key + ':'});
			Donate.update({_id: id}, {$set:{'recurring.subscriptions.canceled': true, 
				'recurring.subscriptions.canceled_at': resultSet.data.canceled_at, 
				'recurring.subscriptions.invoice_count': resultSet.data.invoice_count, 
				'recurring.subscriptions.updated_at': resultSet.data.updated_at
			}});
			return resultSet;
		} else if (getSubscription && getSubscription.data.canceled === true) {
			logger.info("getSubscription.data.canceled = " + getSubscription.data.canceled);
			logger.info("This subscription is already canceled in the billy system. The record has been updated to reflect this.");
			Donate.update({_id: id}, {$set:{'recurring.subscriptions.canceled': true,
				'recurring.subscriptions.canceled_at': getSubscription.data.canceled_at, 
				'recurring.subscriptions.invoice_count': getSubscription.data.invoice_count, 
				'recurring.subscriptions.updated_at': getSubscription.data.updated_at
			}});
			return getSubscription;
		} else{
			throw new Meteor.Error(500, "Something went wronge here");
		}
		
	}
});