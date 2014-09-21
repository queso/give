var bodyParser = Meteor.npmRequire('body-parser');
var EventEmitter = Meteor.npmRequire('events').EventEmitter;

WebApp.connectHandlers.use(bodyParser.urlencoded({
    extended: false}))
    .use(bodyParser.json())
    .use('/events', Meteor.bindEnvironment(function(req, res, next) {

	    /*function lastWord(description) {
		    return ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
	    }*/
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
                e.emit('select', body.events[0].type);
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

	        evt.on('end', function (t) {
		        logger.info('Done with ' + t + ' data events.');
		        res.writeHead(200, {
			        'Content-Type': 'application/json'
		        });
		        res.end("Got it");//TODO: Remove Got it text, just leave blank when this is live.
	        });

	        evt.on('select', function (bodyType) {
		        logger.info("Received type: " + bodyType);

		        //replace the period in the funcName with an underscore
		        var funcName = bodyType.replace(/\./g, '_');
		        logger.info("Sending to: " + funcName);

		        //Send to the evt.on of the same name
		        this.emit([funcName]);
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
	        evt.on('update_from_event', function (id, type, status) {
		        logger.info("Got to update_from_event");
		        logger.info("The ID is: " + id + " The type is: " + type + " This status is: " + status);
                var lookup = type;
		        /*try {*/
                    if (body.events[0].entity[type][0].meta['billy.transaction_guid']) {
                        return;
                    }else {
                        if (lookup === 'debits') {
                            lookup = 'debit';
                            var setModifierID = { $set: {} };
                            setModifierID.$set[lookup + '.id'] = id;
                            Donate.update({'[lookup]id': id}, {$set: {'[lookup].status': status}});
                        } else {
                            Donate.update({'[lookup]id': id}, {$set: {'[lookup].status': status}});
                        }
                    }

		        /*} catch (e) {
			        logger.error(e);
		        }*/
	        });
	        //Duplicate is intentional and a feature of events that allows us to run multiple events from one call
	        evt.on('update_from_event', function (eventID, type, status) {
		        logger.info("Got to update_from_event (2nd)");
		        logger.info("(2nd) The ID is: " + eventID + " The type is: " + type + " This status is: " + status);
		        /*try {*/
			        if (body.events[0].entity[type][0].meta['billy.transaction_guid']) {
                        logger.info("Inside Billy update function of update_from_events 2nd.");
					        /*try {*/
						        var description = body.events[0].entity[type][0].description;
						        var invoiceID = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
                                console.log(invoiceID);
                                var id = Donate.findOne({'recurring.invoices.guid': invoiceID})._id;


                                var lookup = type;
                                if (type === 'debits'){
                                    lookup = 'debit';
                                }
                               /*if (id == null && type === 'debits') {
                                    Utils.getBillySubscriptionGUID(body.events[
                                    return '';0].entity[type][0].description);
                               }*/
                                var setModifierID = { $set: {} };
                                var setModifierStatus = { $set: {} };
                                setModifierID.$set[lookup + '.id'] = eventID;
                                setModifierStatus.$set[lookup + '.status'] = status;
                                Donate.update(id, setModifierID);
                                Donate.update(id, setModifierStatus);
					        /*}catch(e) {
						        logger.error("Error Message: " + e.message);
                                logger.error(e);
					        }*/
			        } else {
				        logger.info("Nothing to update, not a Billy transac/*tion.");
			        }
		        /*} catch (e) {
                    logger.error(e);
		        }*/
	        });
            //UPDATE STATUS END
            evt.on('send_email', function (eventID, type, status) {
                    /*try{*/
                        var updateThis;
                        logger.info("Got to send_email function");
                        if (body.events[0].entity[type][0].meta['billy.transaction_guid'] !== undefined) {
                            var description = body.events[0].entity[type][0].description;
                            var invoiceID = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
                            updateThis = Donate.findOne({'recurring.invoice.items.guid': invoiceID})._id;
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
		        this.emit('update_from_event', body.events[0].entity.debits[0].id, 'debits',
			        body.events[0].entity.debits[0].status);
	        });
	        evt.on('debit_succeeded', function () {
		        logger.info("Got to the debit_succeeded");
		        this.emit('update_from_event', body.events[0].entity.debits[0].id, 'debits',
			        body.events[0].entity.debits[0].status);
                this.emit('send_email', body.events[0].entity.debits[0].id, 'debits', 'succeeded');
                this.emit('log_new_gift', body.events[0].entity.debits[0].id);
                /*if (body.events[0].entity.debits[0].meta['billy.transaction_guid']) {
                    Utils.credit_billy_order(body.events[0].entity.debits[0].id);
                } else{
                    Utils.credit_order(body.events[0].entity.debits[0].id);
                }*/
	        });
	        evt.on('debit_failed', function () {
		        logger.info("Got to the debit_failed");
		        this.emit('update_from_event', body.events[0].entity.debits[0].id, 'debits',
			        body.events[0].entity.debits[0].status);
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