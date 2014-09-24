var bodyParser = Meteor.npmRequire('body-parser');
var EventEmitter = Meteor.npmRequire('events').EventEmitter;

WebApp.connectHandlers.use(bodyParser.urlencoded({
    extended: false}))
    .use(bodyParser.json())
    .use('/events', Meteor.bindEnvironment(function(req, res, next) {

	    //These events will run every time
        function getEvents(body, billy, type) {
            var e = new EventEmitter();

        	// Modify the event binding function to always put callbacks in a Meteor Fiber
        	var prevOn = e.on;
            e.on = function(eventName, callback) {
                EventEmitter.prototype.on.call(this, eventName, Meteor.bindEnvironment(callback.bind(this)));
        	}.bind(e);

            setImmediate(function () {
	            e.setMaxListeners(20);
                e.emit('start');
                logger.info('Body type: ' + body.events[0].type);
                if (billy) {
                    logger.info("Billy Event received.");
                    e.emit('parse_billy_invoice_guid');
                    e.emit('parse_billy_transaction_guid');
                    e.emit('select');
                }else {
                    logger.info("Non-Billy Event received.");
                    e.emit('select');
                }
                e.emit('end', body.events[0].type);
            });
            return(e);
        }

        //Get Events started
        function runEvents (body, billy, type) {
	        var evt = getEvents(body, billy, type);

	        evt.on('start', function () {
		        logger.info("**********Received an event");
	        });
            evt.on('parse_billy_invoice_guid', function(){
                logger.info("Started parse_billy_invoice_guid");
                var description = body.events[0].entity[type][0].description;
                invoice_guid = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
            });
            evt.on('parse_billy_transaction_guid', function(){
                logger.info("Started parse_billy_transaction_guid");
                transaction_guid = body.events[0].entity[type][0].meta['billy.transaction_guid'];
            });
            evt.on('select', function () {
                logger.info("Received type: " + body.events[0].type);
                bodyType = body.events[0].type;
                //replace the period in the funcName with an underscore
                var funcName = bodyType.replace(/\./g, '_');
                logger.info("Sending to: " + funcName);

                //Send to the evt.on of the same name
                this.emit([funcName]);
            });
	        evt.on('end', function (t) {
		        logger.info('Done with ' + t + ' data events.');
		        res.writeHead(200, {
			        'Content-Type': 'application/json'
		        });
		        res.end("Got it");//TODO: Remove Got it text, just leave blank when this is live.
	        });
            


            /*************************************************************/
            /**************        LOG NEW GIFT             **************/
            /*************************************************************/
            evt.on('log_new_gift', function (mixedID, transaction_guid) {
                /*try {*/
                    if(billy){
                        var amount = Donate.findOne({_id: mixedID}).debit.total_amount;
                        logger.info("*****NEW RECURRING GIFT**** id: " + mixedID + "transaction_guid: " + transaction_guid + " Total Amount: $" + amount)
                    }else{
                        var amount = Donate.findOne({"debit.id": mixedID}).debit.total_amount;
                        logger.info("*************NEW GIFT************* id: " + mixedID + " Total Amount: $" + amount)
                    }
                    
                /*}
                catch (e) {
                    logger.error("events.js caught an error when trying to log_new_gift: " + e);
                    throw new Meteor.Error(e);
                }*/
            });
            /*************************************************************/
            /**************        END LOG NEW GIFT        ***************/
            /*************************************************************/

	        /*************************************************************/
	        /**************        UPDATE STATUS            **************/
	        /*************************************************************/
	        evt.on('update_from_event', function (id, status) {
		        logger.info("Got to update_from_event");
		        logger.info("The ID is: " + id + " The type is: " + type + " This status is: " + status);
                var lookup = type;
		        /*try {*/
                        if (lookup === 'debits') {
                            lookup = 'debit';
                            var setModifierID = { $set: {} };
                            setModifierID.$set[lookup + '.id'] = id;
                            Donate.update({'[lookup]id': id}, {$set: {'[lookup].status': status}});
                        } else {
                            Donate.update({'[lookup]id': id}, {$set: {'[lookup].status': status}});
                        }

		        /*} catch (e) {
			        logger.error(e);
		        }*/
	        });
            evt.on('billy_trans_status', function (status) {
                var setModifier = { $set: {} };
                setModifier.$set['recurring.transactions.' + transaction_guid + '.status'] = status;
                Donate.update({_id: id}, setModifier);

                /*Donate.update({
                    _id: id, 'recurring.subscriptions.transactions.guid': transaction_guid}, {
                    $set: {
                        'recurring.transactions.status': status
                    }
                }); */
            });
            evt.on('billy_trans_insert', function (status) {
                var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
                    auth: Meteor.settings.billyKey + ':'
                });
                var lookup_transaction_guid = {};
                lookup_transaction_guid['recurring.transactions.' + transaction_guid + '.guid'] = transaction_guid;
                if(Donate.findOne(lookup_transaction_guid)){
                    this.emit('billy_trans_status', status);
                    /*if(bodyType === 'debit.succeeded' || 'debit.failed'){
                        Utils.send_billy_email(id, transaction_guid, status);
                        return;    
                    }*/
                    
                }else{
                    var setModifier = { $set: {} };
                    transaction.data.email_sent = {};
                    setModifier.$set['recurring.transactions.' + transaction_guid] = transaction.data;
                    Donate.update({_id: id}, setModifier);
                }
            });
            evt.on('update_billy', function (eventID, status){
                logger.info("Inside Billy update function.");

                var lookup_transaction_guid = {};
                lookup_transaction_guid['recurring.transactions.' + transaction_guid + '.guid'] = transaction_guid;
                var lookup_invoice_guid = {};
                lookup_invoice_guid['recurring.invoices.' + invoice_guid + '.guid'] = invoice_guid;

                if(Donate.findOne(lookup_transaction_guid)){
                    logger.info("FOUND A transaction_guid in the collection");
                    id = Donate.findOne(lookup_transaction_guid)._id;
                    this.emit('billy_trans_status', status);
                }else if(Donate.findOne(lookup_invoice_guid)){
                    id = Donate.findOne(lookup_invoice_guid)._id;
                    logger.info("Found the invoice GUID in invoices");
                    this.emit('billy_trans_insert', status);                    
                } else{
                    logger.info("Couldn't find the invoice GUID in invoices, let's go look for it.");
                    logger.info("Going to go find the subscription, insert the invoice into that subscription and " + 
                        "return the id of the collection as well as the subscription GUID.");
                    var subIDs = Utils.getBillySubscriptionGUID(invoice_guid);
                    id = subIDs.id;
                    subscription_guid = subIDs.subscription_guid;
                    this.emit('billy_trans_insert', status);
                    //Need subscription here too, need to make id an object with id and subscription GUID
                }

            });

            /*evt.on('update_status_for_first_time_billy_debit', function (id, eventID, status){
                Donate.update({
                _id: id,
                'recurring.subscriptions.invoices': billySubscribeCustomer.data.guid}, {
                $addToSet: {
                    'recurring.subscriptions.$.invoices': billyGetInvoiceID.data
                }
            });
                    Donate.update(id, {
                        $set: {
                            'recurring.subscriptions.invoices.debit': invoice_guid
                        }
                    })
                });*/
            evt.on('send_email', function (eventID, status) {
                    /*try{*/
                        logger.info("Got to send_email function");
                        if (billy) {
                            logger.info("Already have the id: " + id);

                            //setup query programmatically.
                            var email_sent_lookup = {};
                            email_sent_lookup['recurring.transactions.' + transaction_guid + '.email_sent.' + status] = true;
                            
                            //send out the appropriate email using Mandrill
                            //TODO: Change this to use a programatic query and it really needs to add the status, if the status=succeeded doesn't exists or if the status=failed doesn't exist
                            if (!(Donate.findOne(email_sent_lookup)) && status === 'succeeded' || 'failed') {
                                Donate.update(id, {$set: email_sent_lookup});
                                Utils.send_billy_email(id, transaction_guid, status);
                            }
                            } else {
                                id = Donate.findOne({'debit.id': eventID})._id;
                                logger.info("Here is the id: " + id);
                                //send out the appropriate email using Mandrill
                                if (!(Donate.findOne(id).debit.email_sent)) {
                                    Donate.update(id, {$set: {'debit.email_sent': true}});
                                    Utils.send_one_time_email(id);
                                }
                            }
                        /*}
                        catch(e) {
                            logger.error(e);
                        }*/
            });
            evt.on('failed_collection_update', function (type, debitID){
                console.log('failed_collection_update area. ' + debitID);
                var id = Donate.findOne({'debit.id': debitID})._id;
                    Donate.update(id, {$set: {'failed.failure_reason': body.events[0].entity[type][0].failure_reason,
                        'failed.failure_reason_code': body.events[0].entity[type][0].failure_reason_code,
                        'failed.transaction_number': body.events[0].entity[type][0].transaction_number,
                        'failed.updated': moment().format('MM/DD/YYYY, hh:mm')}}
                    );
            });
	        /*************************************************************/
	        /***************         DEBIT AREA             **************/
	        /*************************************************************/
	        evt.on('debit_created', function () {
		        logger.info("Got to the debit_created");
		        if(billy){
                    this.emit('update_billy', body.events[0].entity.debits[0].id,
			        body.events[0].entity.debits[0].status);
                } else{
                    this.emit('update_from_event', body.events[0].entity.debits[0].id,
                    body.events[0].entity.debits[0].status);
                }
	        });
	        evt.on('debit_succeeded', function () {
		        logger.info("Got to the debit_succeeded");
		        if(billy){
                    this.emit('update_billy', body.events[0].entity.debits[0].id,
                    body.events[0].entity.debits[0].status);
                    Utils.credit_billy_order(id, transaction_guid);
                    this.emit('log_new_gift', id, transaction_guid);
                } else{
                    this.emit('update_from_event', body.events[0].entity.debits[0].id,
                    body.events[0].entity.debits[0].status);
                    Utils.credit_order(body.events[0].entity.debits[0].id);
                    this.emit('log_new_gift', body.events[0].entity.debits[0].id);
                }
                this.emit('send_email', body.events[0].entity.debits[0].id, 'succeeded');
                
	        });
	        evt.on('debit_failed', function () {
		        logger.info("Got to the debit_failed");
		        if(billy){
                    this.emit('update_billy', body.events[0].entity.debits[0].id,
                    body.events[0].entity.debits[0].status);
                } else{
                    this.emit('update_from_event', body.events[0].entity.debits[0].id,
                    body.events[0].entity.debits[0].status);
                }
                this.emit('failed_collection_update', 'debits', body.events[0].entity.debits[0].id);
                this.emit('send_email', body.events[0].entity.debits[0].id, 'debits', 'failed');
	        });
	        /*************************************************************/
	        /***************         END DEBIT AREA         **************/
	        /*************************************************************/

	        /*************************************************************/
	        /***************         Hold AREA             **************/
	        /*************************************************************/
            //TODO: Need to send these to a special event that adds these to the database. Look below for a link to an example.
            //https://www.runscope.com/share/kqnnt5wx1akd/970ea5ab-ea91-476e-9fe3-6a97f272c519
	        evt.on('hold_created', function () {
		        logger.info("Got to hold_created");
	        });
	        evt.on('hold_updated', function () {
		        logger.info("Got to hold_updated");
	        });
	        evt.on('hold_captured', function () {
		        logger.info("Got to hold_captured");
	        });
	        /*************************************************************/
	        /***************         END HOLDS AREA         **************/
	        /*************************************************************/
            //TODO: Need to send these to a special event that adds these to the database. Look below for a link to an example.
            //https://www.runscope.com/share/kqnnt5wx1akd/aed288ff-a1f3-49a0-8dc5-37bc2b3102a9
	        evt.on('card_updated', function () {
		        logger.info("Got to the card_updated");
	        });
	        evt.on('card_created', function () {
		        logger.info("Got to the card_updated");
	        });
	        evt.on('account_created', function () {
		        logger.info("Got to the account_created");
	        });
	        evt.on('bank_account_updated', function () {
		        logger.info("Got to the bank_account_updated");
	        });
	        evt.on('bank_account_created', function () {
		        logger.info("Got to the card_updated");
	        });
        }
	        // Check the body otherwise any invalid call to the website would still run any of the events after checking the body.
	        var body = req.body; //request body

	        /*try {*/
		        body.events ? addTo(body) : noBody();
	        /*} catch (e) {
		        logger.error(e);
	        }*/

            function addTo(body) {
                var type = Object.keys(body.events[0].entity)[0];
                var billy = Boolean(body.events[0].entity[type][0].meta['billy.transaction_guid']);
                runEvents(body, billy, type);
            }
	        function noBody() {
		        logger.warn('No events found in the body, exited.');
		        res.writeHead(404, {
			        'Content-Type': 'application/json'
		        });
		        res.end("404");//TODO: Remove Got it text, just leave blank when this is live.
	        }
}));