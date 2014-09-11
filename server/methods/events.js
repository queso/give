var bodyParser = Meteor.npmRequire('body-parser');
// Fiber is necessary for Collection use and other wrapped methods
var Fiber = Meteor.npmRequire('fibers');
var EventEmitter = Meteor.npmRequire('events').EventEmitter;

var Future = Meteor.npmRequire("fibers/future");

function extractFromPromise(promise) {
	var fut = new Future(function() {
		promise.then(function (result) {
			fut.return(result);
		}, function (error) {
			logger.error(error);
			fut.throw(error);
		});
		return fut.wait();
	});
}
WebApp.connectHandlers.use(bodyParser.urlencoded({
    extended: false}))
    .use(bodyParser.json())
    .use('/events', function(req, res, next) {
    Fiber(function() {

	    function lastWord(description) {
		    return ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
	    }
	    //These events will run every time
        function getEvents(body) {
            var e = new EventEmitter();
            //var a = new EventEmitter(); TODO: remove this line, or find a use for it.
            setImmediate(function () {
	            e.setMaxListeners(20);
                e.emit('start');
                e.emit('checkBody', body);
                e.emit('end', body.events[0].type);
            });
            return(e);
        }

        //Get Events started
        function runEvents (body) {
	        var evt = getEvents(body);

	        evt.on('start', function () {
		        logger.info("*****************Received an event");
	        });

	        evt.on('checkBody', function (d) {
		        logger.info("Got to checkBody");
		        var bodyType = d.events[0].type; //What type of event is coming from Balanced?
		        logger.info('Body type: ' + bodyType);
		        this.emit('select', bodyType);
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
	        /**************        UPDATE STATUS            **************/
	        /*************************************************************/
	        evt.on('update_from_event', function (id, type, status) {
		        logger.info("Got to update_from_event");
		        logger.info("The ID is: " + id + " The type is: " + type + " This status is: " + status);
                var lookup = type;
		        try {
			        new Fiber(function () {
                        if(lookup === 'debits') {
                            lookup = 'debit';
                            console.log("Show see this.");
                            var setModifierID = { $set: {} };
                            setModifierID.$set[lookup + '.id'] = id;
                            Donate.update({'[lookup]id': id}, {$set: {'[lookup].status': status}});
                        } else{
                            Donate.update({'[lookup]id': id}, {$set: {'[lookup].status': status}});
                        }
			        }).run();
		        } catch (e) {
			        logger.error(e);
		        }
	        });
	        //Duplicate is intentional and a feature of events that allows us to run multiple events from one call
	        evt.on('update_from_event', function (eventID, type, status) {
		        logger.info("Got to update_from_event (2nd)");
		        logger.info("(2nd) The ID is: " + eventID + " The type is: " + type + " This status is: " + status);
		        try {
			        if (body.events[0].entity[type][0].meta['billy.transaction_guid']) {
                        console.log("Inside Billy update function of update_from_events 2nd.");
				        Fiber(function () {
					        try {
						        var description = body.events[0].entity[type][0].description;
						        var invoiceID = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
						        var id = Donate.findOne({'recurring.invoice.items.guid': invoiceID})._id;
                                logger.info("InvoiceID lookup found: " + id);
                                var lookup = type;
                                if (type === 'debits'){
                                    lookup = 'debit';
                                }
                                var setModifierID = { $set: {} };
                                var setModifierStatus = { $set: {} };
                                setModifierID.$set[lookup + '.id'] = eventID;
                                setModifierStatus.$set[lookup + '.status'] = status;
                                Donate.update(id, setModifierID);
                                Donate.update(id, setModifierStatus);
					        }catch(e) {
						        logger.error("Error Message: " + e.message);
                                logger.error(e);
					        }
				        }).run();
			        } else {
				        logger.info("Nothing to update, not a Billy transaction.");
			        }
		        } catch (e) {
                    logger.error(e);
		        }
	        });
	        //UPDATE STATUS END
            evt.on('send_email', function (eventID, type, status) {
                Fiber(function () {
                    try{
                        logger.info("Got to send_email function");
                    //console.log(body.events[0].entity[type][0].meta['billy.transaction_guid']);
                /*if (body.events[0].entity[type][0].meta['billy.transaction_guid'] !== undefined) {
                    console.log("Event ID: " + eventID);
                    updateThis = Donate.findOne({'recurring.subscription.guid.': eventID})._id
                } else {
                    updateThis = Donate.findOne({'debit.id': eventID})._id;
                }*/
                    var updateThis = Donate.findOne({'debit.id': eventID})._id;
                    Donate.update(updateThis, {$set: {'debit.email_sent': 'sending'}});
                    //send out the appropriate email using Mandrill
                    Meteor.call('sendEmailOutAPI', updateThis, function (error, result) {
                        logger.info("Completed Email send out API");
                    });
                    }
                    catch(e) {
                        logger.error(e);
                    }}).run();

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
	        });
	        evt.on('debit_failed', function () {
		        logger.info("Got to the debit_failed");
		        this.emit('update_from_event', body.events[0].entity.debits[0].id, 'debits',
			        body.events[0].entity.debits[0].status);
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
	        // TODO: This might not be necessary in the long run because I'll be restricting traffic to /events by IP, but this is still good practice
	        var body = req.body; //request body
	        try {
		        body.events ? runEvents(body) : noBody();
	        } catch (e) {
		        logger.error(e);
	        }

	        function noBody() {
		        logger.warn('No events found in the body, exited.');
		        res.writeHead(404, {
			        'Content-Type': 'application/json'
		        });
		        res.end("404");//TODO: Remove Got it text, just leave blank when this is live.
	        }
        }).run();
});

/*
var body = req.body; //request body
      try {
        var bodyType = body.events[0].type; //What type of event is coming from Balanced?
        logger.info('Callback.js : received an event of type: ' + bodyType);
      } catch (e) {
        logger.error("Callback.js : Threw and error for a received event.")
        logger.error(e);
      }
      // var events = new Meteor.npmRequire(events).EventEmitter;
      // events.on("bank_account.created", bank_accountWrite);
      // events.emit(bodyType, body.events[0]);*/
