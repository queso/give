Evts = {
	recurring_controller: function(body) {
        console.log("Got to recurring_controller");
		var type = 				   Object.keys(body.events[0].entity)[0]; //this is the type of event, less specific, like debit or credit
        if(type === "debits"){
        	var invoice_guid = 		Evts.get_invoice_guid(type, body);
     		var transaction_guid = 	Evts.get_transaction_guid(type, body);
     		var select_type = 		Evts.select_type(body);
     		//var route_type = 		Event_types[select_type](true, body);
            logger.info("Router Type = " + route_type);            
     		var status = 			body.events[0].entity[type][0].status;
     		var billy_id = 			Evts.update_billy(transaction_guid, invoice_guid, type, status, body);
     		if(select_type === "debit_created") {
     			var sending_email_for_created = Evts.send_received_email(true, billy_id, transaction_guid, status, body.events[0].entity.debits[0].amount);
     		}else if(select_type === "debit_succeeded") {
     			var sending_email = Evts.send_email(true, billy_id, transaction_guid, status, body.events[0].entity.debits[0].amount);
                var route_type =        Event_types[select_type](true, billy_id, transaction_guid, null);
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
	update_status: function(type, id, status, body) { //TODO: need to fix this if I move to a seperated collection system
		var lookup = type;
        //try {
                lookup = 'debit';
                var lookup_this = {};
                lookup_this[lookup + '.id'] = id;
                return Donate.update(lookup_this, {$set: {'[lookup].status': status}});
            /*} else {
                return Donate.update({_id: id}, {$set: {'[lookup].status': status}});
            }*/

        /*} catch (e) {
	        logger.error(e);
        }*/
	},
	insert_transaction: function(transaction_guid, id, type, body) {
		var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
                auth: Meteor.settings.billy_key + ':'
        });
     
        var lookup_transaction_guid = {};
        lookup_transaction_guid['recurring.transactions.' + transaction_guid + '.guid'] = transaction_guid;
     
        if(Donate.findOne(lookup_transaction_guid)){
            var status_update = Evts.update_status(type, id, body);
            return status_update;
            //this.emit('billy_trans_status', status);
        }else{
            var setModifier = { $set: {} };
            transaction.data.email_sent = {};
            setModifier.$set['recurring.transactions.' + transaction_guid] = transaction.data;
            
            //update the document with the data received from billy on this transaction
            var inserted = Donate.update({_id: id}, setModifier);
            return inserted;
        }
	},
	update_billy: function(transaction_guid, invoice_guid, type, status, body) {
		/*try{*/
            logger.info("Inside update_billy function.");

            //programatic search operators setup
            var lookup_transaction_guid = {};
            lookup_transaction_guid['recurring.transactions.' + transaction_guid + '.guid'] = transaction_guid;
            var lookup_invoice_guid = {};
            lookup_invoice_guid['recurring.invoices.' + invoice_guid + '.guid'] = invoice_guid;

            logger.info("Before findOne");
            var testValue = Donate.findOne(lookup_transaction_guid);
            logger.info("After testValue var setup");
            if(testValue){

                logger.info("FOUND A transaction_guid in the collection");
                var id = Donate.findOne(lookup_transaction_guid)._id;
                var status_update = Evts.update_status(type, id, body);
                return id;
            }else if(Donate.findOne(lookup_invoice_guid)){
                var id = Donate.findOne(lookup_invoice_guid)._id;
                logger.info("Found the invoice GUID in invoices");
                var insert_trans = Evts.insert_transaction(transaction_guid, id, type, body);
                return id;
                //this.emit('billy_trans_insert', status);                    
            } else{
                logger.info("Couldn't find the invoice GUID in invoices, let's go look for it.");
                logger.info("Going to go find the subscription, insert the invoice into that subscription and " + 
                    "return the id of the collection as well as the subscription GUID.");
                var subscription_info = Utils.getBillySubscriptionGUID(invoice_guid);
                if(subscription_info && subscription_info.id){
                    var id = subscription_info.id;
                    var subscription_guid = subscription_info.subscription_guid;
                    var insert_trans = Evts.insert_transaction(transaction_guid, id, type, body);
                    return id;
                    //Need subscription here too, need to make id an object with id and subscription GUID
                } else {
                    logger.info("No id found");
                    var id = "NoIDFound";
                    return id;
                }
            }
        /*}catch(e){
            logger.error(e);
        }*/
	},
	send_received_email: function (billy, mixedID, transaction_guid, status, body_amount) {
		/*try{*/
            
            if (billy) {
                logger.info("Inside send_received_email Billy section.");
                var amount = Donate.findOne({_id: mixedID}).recurring.subscriptions.amount;
                if(body_amount !== amount){
                    logger.error("The amount in the event and the amount in the lookup record do not match");
                    return "Amounts do not match, exiting";
                }
                //setup query programmatically.
                var email_sent_lookup = {};
                email_sent_lookup['recurring.transactions.' + transaction_guid + '.email_sent.initial_sent'] = true;
                var email_sent_lookup_time = {};
                email_sent_lookup_time['recurring.transactions.' + transaction_guid + '.email_sent.initial_time'] = moment.utc().format('MM/DD/YYYY, hh:mm');
                var transaction_guid_exists = {};
                transaction_guid_exists['recurring.transactions.' + transaction_guid + '.guid'] = transaction_guid;

                if(Donate.findOne(email_sent_lookup) || Donate.findOne({_id: mixedID}).recurring.subscriptions.debitInformation.donateWith === "Card"){
                    logger.info("Initial email sent = true or this is a credit card transaction. Nothing further to do.");
                } else if(Donate.findOne(transaction_guid_exists)){
                    Donate.update(mixedID, {$set: email_sent_lookup});
                    Donate.update(mixedID, {$set: email_sent_lookup_time});
                    var send_initial_email = Utils.send_initial_email(mixedID, status);
                } else{
                    throw new Meteor.Error(404, 'Error: Not found', transaction_guid);
                }
            } else{
                //send out the appropriate email using Mandrill
                if (Donate.findOne({'debit.id': mixedID})) {
                	if (!(Donate.findOne({'debit.id': mixedID}).debit.initial_email_sent) || Donate.findOne({_id: mixedID}).recurring.subscriptions.debitInformation.donateWith === "Card") {
                    var id = Donate.findOne({'debit.id': debitID})._id;
                    Donate.update({_id: id}, {$set: {'debit.initial_email_sent': true, 'debit.initial_time': moment.utc().format('MM/DD/YYYY, hh:mm')}});
                    var send_initial_email = Utils.send_initial_email(id, status);
	                } else{
	                    logger.info("Looks like this is either a Card transaction or the email has already been sent.");
	                }
            	}else{
                    logger.error("Inside recurring_event_controller.js -> send_received_email -- Given that mixedID debitID I can't find the document in mongo. This might be because the user was stopped on the initial page before the debit was entered.");
	            }
            }
        /*}
        catch(e){
            logger.error(e);
        }*/
	},
	send_email: function(billy, mixedID, transaction_guid, status, body_amount) {
		// try{
            logger.info("Got to send_email function");
            if (billy) {
                var amount = Donate.findOne({_id: mixedID}).recurring.subscriptions.amount;
                if(body_amount !== amount){
                    logger.error("The amount in the event and the amount in the lookup record do not match");
                    return "Amounts do not match, exiting";
                }
                //setup query programmatically.
                var email_sent_lookup = {};
                email_sent_lookup['recurring.transactions.' + transaction_guid + '.email_sent.' + status] = true;
                var email_sent_lookup_time = {};
                email_sent_lookup_time['recurring.transactions.' + transaction_guid + '.email_sent.time'] = moment.utc().format('MM/DD/YYYY, hh:mm');
                
                //send out the appropriate email using Mandrill
                if(Donate.findOne(email_sent_lookup)){
                    console.log("Email sent status = true nothing further to do.");
                }else if (status === 'succeeded' || 'failed') {
                    Donate.update(mixedID, {$set: email_sent_lookup});
                    Donate.update(mixedID, {$set: email_sent_lookup_time});
                    var send_billy_email = Utils.send_billy_email(mixedID, transaction_guid, status);
                }
            }else {
                if(Donate.findOne({'debit.id': mixedID})){
                    var id = Donate.findOne({'debit.id': mixedID})._id;
                    logger.info("Here is the id: " + id);  
                } else{
                    logger.error("Inside events.js -> send_email -- Given that eventID I can't find the document in mongo. This might be because the user was stopped on the initial page before the debit was entered.");
                }
                //send out the appropriate email using Mandrill
                if(id){
                    if (!(Donate.findOne(id).debit.email_sent)) {
                        Donate.update(id, {$set: {'debit.email_sent': true, 'debit.email_sent_time': moment.utc().format('MM/DD/YYYY, hh:mm')}});
                        var send_billy_email = Utils.send_one_time_email(id);
                    }    
                }
            }
            
        /*}
        catch(e) {
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
                    'failed.updated': moment.utc().format('MM/DD/YYYY, hh:mm'),
                    'debit.status': 'failed'}}
                );
            }

        }else if(Donate.findOne({'debit.id': event_debit_id})) {
            var id = Donate.findOne({'debit.id': event_debit_id})._id;
            if (id){
                Donate.update(id, {$set: {'failed.failure_reason': body.events[0].entity[type][0].failure_reason,
                    'failed.failure_reason_code': body.events[0].entity[type][0].failure_reason_code,
                    'failed.transaction_number': body.events[0].entity[type][0].transaction_number,
                    'failed.updated': moment.utc().format('MM/DD/YYYY, hh:mm'),
                    'debit.status': 'failed'}}
                );
            } else{
                logger.error("Faield to find an id inside of failed_collection_update");
            }
        } else{
            logger.error("Can't run a failed_collection_update when the debitID passed in can't be found in the collection. Check to see if this is a Billy debit.");    
        }
	}
};	