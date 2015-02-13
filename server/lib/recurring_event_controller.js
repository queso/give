Evts = {
	recurring_controller: function(body) {
        logger.info("Got to recurring_controller");
		var type = 				   Object.keys(body.events[0].entity)[0]; //this is the type of event, less specific, like debit or credit
        if(type === "debits"){
        	var invoice_guid = 		Evts.get_invoice_guid(type, body);
            var subscription_info = Utils.getBillySubscriptionGUID(invoice_guid);
            var subscription_guid = subscription_info.subscription_guid;
     		var transaction_guid = 	Evts.get_transaction_guid(type, body);
     		var select_type = 		Evts.select_type(body);
     		var status = 			body.events[0].entity[type][0].status;
     		var billy_id = 			Evts.update_billy(transaction_guid, invoice_guid, subscription_info, type, status, body);

     		if(select_type === "debit_created") {
     			var sending_email_for_created = Evts.send_email(true, billy_id, transaction_guid, subscription_guid, 'initial_sent', status, body.events[0].entity.debits[0].amount);
                Meteor.setTimeout(function(){
                    //Call the DT_Donation update function
                    // this should update in DT
                });

     		} else if(select_type === "debit_succeeded") {
                var debit_cursor = Debits.findOne({id: body.debits[0].id});
                var amount = debit_cursor.amount;
                if(amount === body.events[0].entity.debits[0].amount) {
                    var sending_email = Evts.send_email(true, billy_id, transaction_guid, subscription_guid, 'succeeded_sent', status, body.events[0].entity.debits[0].amount);
                    var route_type =    Event_types[select_type](true, billy_id, transaction_guid, null);
                } else{
                    logger.error("The amount from the received event and the amount of the subscription do not match!");
                }
     		} else if(select_type === "debit_failed"){
     			var failed_update = Evts.failed_collection_update(true, 'debits', body.events[0].entity.debits[0].id, invoice_guid, body);
     		}
        } else{
            //Not handling any other event types at this time (don't really see the need to)
            logger.info("************* Received an event and didn't do anything with it.");
        }
	},
	get_transaction_guid: function(type, body) {
		logger.info("Started get_transaction_guid");
        return (body.events[0].entity[type][0].meta['billy.transaction_guid']);
	},
	log_new_gift: function(billy, mixedID, transaction_guid) {
		//TODO: Need to complete this
	},
	update_status: function(type, id, status, body, transaction_guid, invoice_guid) { 
		var lookup = type;
        try {
                var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
                    auth: Meteor.settings.billy_key + ':'
                });
                logger.info(transaction);
             
                var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + transaction.data.invoice_guid, {
                    auth: Meteor.settings.billy_key + ':'
                });

                Donate.update({'transactions.guid': transaction_guid}, {$set: {
                    'transactions.$.status': transaction.data.status, 
                    'transactions.$.processor_uri': transaction.data.processor_uri
                }});

                Donate.update({'invoices.guid': invoice_guid}, {$set: {
                    'invoices.$.status': invoice.data.status, 
                    'invoices.$.processor_uri': invoice.data.processor_uri
                }});

                lookup = 'debit';
                var lookup_this = {};
                lookup_this[lookup + '.id'] = id;
                return Donate.update(lookup_this, {$set: {'[lookup].status': status}});

        } catch (e) {
	        logger.error(e);
        }
	},
	insert_transaction: function(transaction_guid, subscription_guid, id, type, body) {
		var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
                auth: Meteor.settings.billy_key + ':'
        });
        logger.info(transaction);
     
        var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + transaction.data.invoice_guid, {
                auth: Meteor.settings.billy_key + ':'
        });

        var lookup_transaction_guid = {};
        lookup_transaction_guid['transactions.guid'] = transaction_guid;
     
        if(Donate.findOne(lookup_transaction_guid)){
            logger.info(transaction_guid);
            var status_update = Evts.update_status(type, id, transaction.data.status, body, transaction_guid, transaction.data.invoice_guid);
            return status_update;
        }else{
            transaction.data.email_sent = {'initial_sent': false, 'succeeded_sent': false};
            transaction.data.credit = {};
            transaction.data.subscription_guid = subscription_guid;
            //update the document with the data received from billy on this transaction
            var transaction_inserted = Donate.update({_id: id}, {
                $push: {
                    'transactions': transaction.data
               }
            });

            //Also push this invoice
            var invoice_inserted = Donate.update({_id: id}, {
                $push: {
                    'invoices': invoice.data
               }
            });


            //var setThis = Donate.update({'transactions.guid': transaction_guid}, {$set: {'transactions.$.credit.sent': false}});
            return transaction_inserted;
        }
	},
	update_billy: function(transaction_guid, invoice_guid, subscription_info, type, status, body) {
		try{
            logger.info("Inside update_billy function.");
            logger.info("Invoices GUID: " + invoice_guid);

            //programatic search operators setup
            var lookup_transaction_guid = {};
            lookup_transaction_guid['transactions.guid'] = transaction_guid;
            var lookup_invoice_guid = {};
            lookup_invoice_guid['invoices.guid'] = invoice_guid;
            if(Donate.findOne(lookup_transaction_guid)){
                logger.info("FOUND A transaction_guid in the collection: " + transaction_guid);
                
                var id = Donate.findOne(lookup_transaction_guid)._id;
                var status_update = Evts.update_status(type, id, status, body, transaction_guid, invoice_guid);
                return id;
            }else if(Donate.findOne(lookup_invoice_guid)){
                var id = Donate.findOne(lookup_invoice_guid)._id;
                logger.info("Found the invoice GUID in invoices");
                var insert_trans = Evts.insert_transaction(transaction_guid, subscription_info.subscription_guid, id, type, body);
                return id;
            } else{
                logger.info("Couldn't find the invoice GUID in invoices, let's go look for it.");
                logger.info("Going to go find the subscription, insert the invoice into that subscription and return the id of the collection as well as the subscription GUID.");
                if(subscription_info && subscription_info.id){
                    var id = subscription_info.id;
                    var insert_trans = Evts.insert_transaction(transaction_guid, subscription_info.subscription_guid, id, type, body);
                    return id;
                    //Need subscription here too, need to make id an object with id and subscription GUID
                } else {
                    logger.info("No id found");
                    var id = "NoIDFound";
                    return id;
                }
            }
        }catch(e){
            logger.error(e);
        }
	},
	failed_collection_update: function (billy, type, event_debit_id, invoice_guid, body){
        try {
            if (billy) {
                var returnedIDs = Utils.getBillySubscriptionGUID(invoice_guid);
                if (returnedIDs) {
                    id = returnedIDs.id;
                    subscription_guid = returnedIDs.subscription_guid;

                    Donations.update(id, {
                            $set: {
                                'failed.failure_reason': body.events[0].entity[type][0].failure_reason,
                                'failed.failure_reason_code': body.events[0].entity[type][0].failure_reason_code,
                                'failed.transaction_number': body.events[0].entity[type][0].transaction_number,
                                'failed.updated': moment().valueOf()
                            }
                        }
                    );

                    Debits.upsert(id,
                        {
                            'failure_reason': body.events[0].entity[type][0].failure_reason,
                            'failure_reason_code': body.events[0].entity[type][0].failure_reason_code,
                            'status': 'failed'
                        }
                    );
                }
            } else {
                var debit = body.events[0].entity[type][0];
                debit._id = debit.id;
                debit.failure_reason =  body.events[0].entity[type][0].failure_reason;
                debit.failure_reason_code = body.events[0].entity[type][0].failure_reason_code;
                debit.status =  'failed';
                Debits.upsert(debit);
            }
        } catch (e) {
            logger.error(e);
        }
	}
};