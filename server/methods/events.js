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
                    e.emit('parse_billy_invoice_guid');
                    e.emit('parse_billy_transaction_guid');
                    e.emit('select');
                }else {
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
                logger.info("Billy true");
                var description = body.events[0].entity[type][0].description;
                invoice_guid = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
            });
            evt.on('parse_billy_transaction_guid', function(){
                logger.info("Started parse_billy_transaction_guid");
                transaction_guid = body.events[0].entity[type][0].meta['billy.transaction_guid'];
            });
            evt.on('select', function () {
                logger.info("Received type: " + body.events[0].type);
                var bodyType = body.events[0].type;
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
            evt.on('log_new_gift', function (id) {
                /*try {*/
                    var amount = Donate.findOne({"debit.id": id}).debit.total_amount;
                    logger.info("**********************NEW GIFT******************** id: " + id + " Total Amount: $" + amount)
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
                Donate.update({
                    id, 'recurring.subscriptions.invoices.transactions.guid': transaction_guid}, {
                    $set: {
                        'recurring.subscriptions.transactions.invoices.$.status': status
                    }
                }); 
            });
            evt.on('billy_trans_insert', function () {
                var transaction = HTTP.get("https://billy.balancedpayments.com/v1/transactions/" + transaction_guid, {
                    auth: Meteor.settings.billyKey + ':'
                });
                Donate.update({
                    id,
                    'recurring.subscriptions.invoices.guid': invoice_guid}, {
                    $push: {
                        'recurring.subscriptions.invoices.$.transactions': transaction
                    }
                });
            });
            evt.on('billy_invoice', function (status) {
                if(Donate.findOne({'recurring.subscriptions.invoices.guid': invoice_guid})){
                    Donate.update({
                    id,
                    'recurring.subscriptions.invoices.guid': invoice_guid}, {
                    $push: {
                        'recurring.subscriptions.$.invoices': transaction
                    }
                });

                var invoice = HTTP.get("https://billy.balancedpayments.com/v1/invoices/" + invoice_guid, {
                    auth: Meteor.settings.billyKey + ':'
                });
                Donate.update({
                    id,
                    'recurring.subscriptions.invoices.guid': invoice_guid}, {
                    $push: {
                        'recurring.subscriptions.$.invoices': transaction
                    }
                });

                }

            });
            /*evt.on('billy_subscription', function () {
                if(Donate.findOne({'recurring.subscriptions.guid': subscription_guid})){

                }
            });*/
            evt.on('update_billy', function (eventID, status){
                logger.info("Inside Billy update function.");
                if(Donate.findOne({'recurring.subscriptions.invoices.transactions.guid': transaction_guid})){
                    logger.info("FOUND A transaction_guid in the collection");
                    id = Donate.findOne({'recurring.subscriptions.invoices.transactions.guid': transaction_guid})._id;
                    this.emit('billy_trans_status', status);
                }else if(Donate.findOne({'recurring.subscriptions.invoices.guid': invoice_guid})){
                    id = Donate.findOne({'recurring.subscriptions.invoices.guid': invoice_guid})._id;
                    logger.info("Found the invoice GUID in invoices");
                    this.emit('billy_trans_insert');                    
                } else{
                    logger.info("Couldn't find the invoice GUID in invoices, let's go look for it.");
                    logger.info("Going to go find the subscription, insert the invoice into that subscription and" + 
                        "return the id of the collection as well as the subscription GUID.");
                    id = Utils.getBillySubscriptionGUID(invoice_guid);
                    this.emit('')
                    //Need subscription here too, need to make id an object with id and subscription GUID
                }

            });
            //UPDATE STATUS END

            evt.on('update_status_for_first_time_billy_debit', function (id, eventID, status){
                








                Donate.update({
                id,
                'recurring.subscriptions.invoices': billySubscribeCustomer.data.guid}, {
                $push: {
                    'recurring.subscriptions.$.invoices': billyGetInvoiceID.data
                }
            });








                    Donate.update(id, {
                        $set: {
                            'recurring.subscriptions.invoices.debit': invoice_guid
                        }
                    })
                });
            evt.on('send_email', function (eventID, status) {
                    /*try{*/
                        var updateThis;
                        logger.info("Got to send_email function");
                        if (billy) {
                            updateThis = Donate.findOne({'recurring.subscriptions.invoices.items.guid': invoice_guid})._id;
                        } else {
                            updateThis = Donate.findOne({'debit.id': eventID})._id;
                        }

                        //send out the appropriate email using Mandrill
                        if (!(Donate.findOne(updateThis).debit.email_sent)) {
                            Donate.update(updateThis, {$set: {'debit.email_sent': true}});
                            Meteor.call('sendEmailOutAPI', updateThis, function (error, result) {
                                logger.info("Completed Email send out API");
                            });
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
                    Utils.credit_billy_order(body.events[0].entity.debits[0].id);
                } else{
                    this.emit('update_from_event', body.events[0].entity.debits[0].id,
                    body.events[0].entity.debits[0].status);
                    Utils.credit_order(body.events[0].entity.debits[0].id);
                }
                this.emit('send_email', body.events[0].entity.debits[0].id, 'succeeded');
                this.emit('log_new_gift', body.events[0].entity.debits[0].id);
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