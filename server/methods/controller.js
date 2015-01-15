_.extend(Evts,{
	controller: function(body) {
		var type = Object.keys(body.events[0].entity)[0];
		logger.info("Type is equal to: " + type);
		if(type === "debits"){
			logger.info("Inside one_time_controller and debits area");
			var status 		=			body.events[0].entity[type][0].status;
			var id 			= 			body.events[0].entity.debits[0].id;
			var amount 		=			body.events[0].entity.debits[0].amount;
			var billy 		= 			body.events[0].entity.debits[0].meta['billy.transaction_guid'] !== undefined;
			var subscription_guid;
			var trans_guid;
			var invoice_guid;
			if (billy === true) {
				invoice_guid = 				Evts.get_invoice_guid(body.events[0].entity[type][0].description);
				var subscription_info = 	Evts.getBillySubscriptionGUID(invoice_guid);
				subscription_guid = 		subscription_info.subscription_guid;
				trans_guid = 				body.events[0].entity.debits[0].meta['billy.transaction_guid'];
			}

			var select_type = 	body.events[0].type;
			select_type 	=	Evts.select_type(select_type);

			logger.info("Received an event of type: " + select_type);

			//Send to the appropriate function based on the type received from Balanced
			Evts[select_type](id, billy, trans_guid, subscription_guid, invoice_guid, status, amount, body);
 		} else{
            logger.info("************* Received an event and didn't do anything with it.");
        }
	},
	debit_created: function(id, billy, trans_guid, subscription_guid, invoice_guid, status, amount, body){
		logger.info("Inside debit_created with debit ID: " + id);
		logger.info("Checking to see if this debit ID exists in the collection");
		var check_id = Evts.check_for_debit(id, 'debit_created', body, billy, trans_guid, subscription_guid);
		Utils.send_donation_email(billy, id, trans_guid, subscription_guid, amount, 'created');
	},
	debit_failed: function(id, billy, trans_guid, subscription_guid, invoice_guid, status, amount, body){
		if(billy){
			//Utils.send_donation_email(billy, id, subscription_guid, amount, 'failed');
			// TODO: need to get this working, not sure how to test this though. Also, it usually fails many times, so only send one email.
		}
		//Evts.update_email_collection(id, 'failed'); //also, this doesn't go here, need to send the update from within Mandrill
		//Utils.failed_collection_update(billy, 'debits', id, null, body);
		//TODO: need to figure out what needs to be done here (if anything)
	},
	debit_succeeded: function(id, billy, trans_guid, subscription_guid, invoice_guid, status, amount, body){
		var stored_amount = Debits.findOne({_id: id}).amount;

		if(stored_amount === amount) {
			if(amount >= 50000){
				Utils.send_donation_email(billy, id, trans_guid, subscription_guid, amount, 'large_gift');
			}
			Utils.send_donation_email(billy, id, trans_guid, subscription_guid, amount, 'succeeded');
			Utils.credit_order(billy, id);
			if(billy){
				Evts.addTrans_Invoice(trans_guid, subscription_guid, invoice_guid);
			}
		} else{
			logger.error("The amount from the received event and the amount of the debit do not match!");
		}
	},
	select_type: function(type) {
		return (type).replace(/\./g, '_');
	},
	get_donate_with: function(customer_cursor, source){
		var donateWith;
		if(source.slice(0,2) === 'CC'){
			var card = _.findWhere(customer_cursor.cards, {id: source});
			return card.brand + ", ending in " + card.number.slice(-4);
		} else if (source.slice(0,2) === 'BA'){
			var bank_account = _.findWhere(customer_cursor.bank_accounts, {id: source});
			return bank_account.bank_name +  ", ending in " + bank_account.account_number.slice(-4);
		}
	},
	update_email_collection: function (id, type) {
		if(type === 'created'){
			Emails.update({balanced_debit_id: id}, {
				$set: {
					'created.sent': true,
					'created.time': new Date()
				}},
				{
					upsert: true
				}
			);
		} else if (type === 'succeeded') {
			Emails.update({balanced_debit_id: id}, {
				$set: {
					'succeeded.sent': true,
					'succeeded.time': new Date()
				}},
				{
					upsert: true
				}
			);
		} else if (type === 'large_gift') {
			Emails.update({balanced_debit_id: id}, {
				$set: {
					'large_gift.sent': true,
					'large_gift.time': new Date()
				}},
				{
					upsert: true
				}
			);
		}
	},
	check_for_debit: function (id, type, body, billy, trans_guid, subscription_guid) {
		if (Debits.findOne({_id: id})) {
			return 1;
		} else if(billy){
			var insert_debit;
			console.log(body.events[0].entity.debits[0]);
			if(!Donations.findOne({'subscriptions.guid': subscription_guid})){
				Convert.start_conversion(id, type, body, billy, trans_guid, subscription_guid);
			}

			insert_debit.donation_id = 		Donations.findOne({'subscriptions.guid': subscription_guid})._id;
			insert_debit.transaction_guid = trans_guid;
			delete insert_debit.meta;

			//Insert object into debits collection and get the _id
			Debits.insert({_id: id}, insert_debit);

		} else {
			//TODO: this should still insert the donation_id, my guess is that if we get here it is because there
			//TODO: were multiple attempts to process the failed payment and eventually it went through.
			var insert_body = Debits.insert({_id: id}, body.events[0].entity.debits[0]);
			return insert_body;
		}
	},
	get_invoice_guid: function(description) {
		logger.info("Started get_invoice_guid");
		return (("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop());
	},
	getBillySubscriptionGUID: function(invoiceID){
		logger.info("Inside getBillySubscriptionGUID");

		var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoiceID, {
			auth: Meteor.settings.billy_key + ':'
		});

		var subscription_guid = invoice.data.subscription_guid;
		logger.info("Got the subscription_guid: " + subscription_guid);

		return subscription_guid;
	},
	addTrans_Invoice: function(trans_guid, subscription_guid, invoice_guid){
		var invoice = getInvoice(invoice_guid);
		Donations.update({'subscriptions.guid': subscription_guid}, {
			$push: {
				'invoices': invoice
			}
		});
		var transaction = getTrans(trans_guid);
		Donations.update({'subscriptions.guid': subscription_guid}, {
			$push: {
				'transactions': transaction
			}
		});
	},
	getTrans: function(trans_guid){
		var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
			auth: Meteor.settings.billy_key + ':'
		}).data;
		return transaction;
	},
	getInvoice: function(invoice_guid){
		var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoice_guid, {
			auth: Meteor.settings.billy_key + ':'
		}).data;
		return invoice;
	}
});