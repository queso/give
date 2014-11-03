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
     		}else if(select_type === "debit_succeeded") {
                var amount = Donate.findOne({'subscriptions.guid': subscription_guid}, {'subscriptions': 1}).subscriptions;
                amount = _.findWhere(amount, {guid: subscription_guid}).amount;
                if(amount === body.events[0].entity.debits[0].amount) {
                    var sending_email = Evts.send_email(true, billy_id, transaction_guid, subscription_guid, 'succeeded_sent', status, body.events[0].entity.debits[0].amount);
                    var route_type =    Event_types[select_type](true, billy_id, transaction_guid, null);
                } else{
                    logger.error("The amount from the received event and the amount of the subscription do not match!");
                }
                
     		}
     		if(select_type === "debit_failed"){
     			var failed_update = Evts.failed_collection_update(true, 'debits', body.events[0].entity.debits[0].id, invoice_guid, body);
     		}
        } else{
            logger.info("************* Received an event and didn't do anything with it.");
        }
	},
	select_type: function(body) {
		return (body.events[0].type).replace(/\./g, '_');
	},
	get_invoice_guid: function(type, body) {
		logger.info("Started get_invoice_guid");
        var description = body.events[0].entity[type][0].description;
        return (("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop());
	},
	get_transaction_guid: function(type, body) {
		logger.info("Started get_transaction_guid");
        return (body.events[0].entity[type][0].meta['billy.transaction_guid']);
	},
	log_new_gift: function(billy, mixedID, transaction_guid) {
		//TODO: Need to complete this
	},
	update_status: function(type, id, status, body) { 
		var lookup = type;
        try {
                lookup = 'debit';
                var lookup_this = {};
                lookup_this[lookup + '.id'] = id;
                return Donate.update(lookup_this, {$set: {'[lookup].status': status}});
            /*} else {
                return Donate.update({_id: id}, {$set: {'[lookup].status': status}});
            }*/

        } catch (e) {
	        logger.error(e);
        }
	},
	insert_transaction: function(transaction_guid, subscription_guid, id, type, body) {
		var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
                auth: Meteor.settings.billy_key + ':'
        });
     
        var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + transaction.data.invoice_guid, {
                auth: Meteor.settings.billy_key + ':'
        });

        var lookup_transaction_guid = {};
        lookup_transaction_guid['transactions.guid'] = transaction_guid;
     
        if(Donate.findOne(lookup_transaction_guid)){
            var status_update = Evts.update_status(type, id, body);
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
                logger.info("FOUND A transaction_guid in the collection");


                var id = Donate.findOne(lookup_transaction_guid)._id;
                var status_update = Evts.update_status(type, id, body);
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
	send_email: function (billy, mixedID, transaction_guid, subscription_guid, email_type, status, body_amount) {
		/*try{*/
            logger.info("Got to send_email function.");
            if (billy) {
                logger.info("Inside send_email Billy section.");

                var subscription_values = Donate.findOne({'subscriptions.guid': subscription_guid}, {'subscriptions.$': 1}).subscriptions;
                var subscription = _.findWhere(subscription_values, {guid: subscription_guid});
                var amount = subscription.amount;
                if(body_amount !== amount){
                    logger.error("The amount in the event and the amount in the lookup record do not match");
                    return "Amounts do not match, exiting";
                }
                console.log("transaction_guid: " + transaction_guid);
                var checkThis = Donate.findOne({'transactions.guid': transaction_guid}, {'transactions.$': 1});
                var transaction = _.findWhere(checkThis.transactions, { guid: transaction_guid });
                console.log("transaction : " + transaction);

                var paymentType = subscription.debitInformation.donateWith;

                if(transaction){
                    console.log(transaction.email_sent[email_type]);
                    if(transaction.email_sent[email_type]) {
                        logger.info("Email sent = true Nothing further to do.");
                    } else {
                        var email_sent_update = {};
                        if(email_type === 'initial_sent') {
                            if(paymentType !== "card" && paymentType !== "Card") {
                                email_sent_update['transactions.$.email_sent.initial_sent'] = true;
                                email_sent_update['transactions.$.email_sent.initial_time'] = moment().valueOf();
                                Donate.update({'transactions.guid': transaction_guid}, {$set: email_sent_update});
                                var send_initial_email = Utils.send_initial_email(checkThis._id, true, transaction_guid);
                            }
                        }else {
                            email_sent_update['transactions.$.email_sent.succeeded_sent'] = true;
                            email_sent_update['transactions.$.email_sent.succeeded_time'] = moment().valueOf();
                            Donate.update({'transactions.guid': transaction_guid}, {$set: email_sent_update});
                            var send_billy_email = Utils.send_billy_email(mixedID, transaction_guid, status);
                        }
                    } 
                }else{
                    throw new Meteor.Error(404, 'Error: Not found', transaction_guid);
                }
            } else if(Donate.findOne({'debit.id': mixedID})){
                    var record_lookup = Donate.findOne({'debit.id': mixedID});
                    logger.info("Found an ID: " + record_lookup._id);
                    if (!record_lookup.debit.email_sent[email_type]) { //|| !paymentType === "Card" || !paymentType === "card"
                        if(email_type === 'initial_sent') {
                            Donate.update({_id: record_lookup._id}, {$set: {'debit.email_sent.initial_sent': true, 'debit.email_sent.initial_time': moment().valueOf()}});
                            var send_initial = Utils.send_initial_email(record_lookup._id, false, null);
                        }else {
                            Donate.update({_id: record_lookup._id}, {$set: {'debit.email_sent.succeeded_sent': true, 'debit.email_sent.succeeded_time': moment().valueOf()}});
                            var send_one_time = Utils.send_one_time_email(record_lookup._id);
                        }
                    } else{
                        logger.info("Looks like this is either a Card transaction or the email has already been sent.");
                    }    
                }else{
                    logger.error("Inside events.js -> send_email -- Given that eventID I can't find the document in mongo. This might be because the user was stopped on the initial page before the debit was entered.");
                }
            /*}
        catch(e){
            logger.error(e);
        }*/
	},
	failed_collection_update: function (billy, type, event_debit_id, invoice_guid, body){
		if(billy){
            var returnedIDs = Utils.getBillySubscriptionGUID(invoice_guid);
            if(returnedIDs){
                id = returnedIDs.id;
                subscription_guid = returnedIDs.subscription_guid;

                Donate.update(id, {$set: {'failed.failure_reason': body.events[0].entity[type][0].failure_reason,
                    'failed.failure_reason_code': body.events[0].entity[type][0].failure_reason_code,
                    'failed.transaction_number': body.events[0].entity[type][0].transaction_number,
                    'failed.updated': moment().valueOf(),
                    'debit.status': 'failed'}}
                );
            }

        }else if(Donate.findOne({'debit.id': event_debit_id})) {
            var id = Donate.findOne({'debit.id': event_debit_id})._id;
            if (id){
                Donate.update(id, {$set: {'failed.failure_reason': body.events[0].entity[type][0].failure_reason,
                    'failed.failure_reason_code': body.events[0].entity[type][0].failure_reason_code,
                    'failed.transaction_number': body.events[0].entity[type][0].transaction_number,
                    'failed.updated': moment().valueOf(),
                    'debit.status': 'failed'}}
                );
            } else{
                logger.error("Faield to find an id inside of failed_collection_update");
            }
        } else{
            logger.error("Can't run a failed_collection_update when the event_debit_id passed in can't be found in the collection. Check to see if this is a Billy debit.");    
        }
	}
};	