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
			console.log(error);
			fut.throw(error);
		});
		return fut.wait();
	});
}
WebApp.connectHandlers.use(bodyParser.urlencoded({
    extended: false}))
    .use(bodyParser.json())
    .use('/events/', function(req, res, next) {
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

        //This function may be needed if it turns out that events are coming in out of order, or if
        // success and failures are both coming in for the same event types, in which case the client could
        // get conflicting emails.
        /*function fetchLatestStatus(eventID){ //TODO: figure out if this part is even necessary, doesn't seem to do much, except that it checks the status is correct.
            *//*try {*//* //TODO: turn try and catch back on
	            //TODO: change /events/ URL to something extracted from the POST event call here.
	            fetchStatus = extractFromPromise(balanced.marketplace.get('/events/EVa48561f6274d11e4ae5502d2dca51d8a'));
	            console.log("Status: " + fetchStatus);
	            Donate.update({'events[0].id': eventID}, {$set: {event_status: fetchStatus}});
            *//*}catch(e) {
	            logger.error("Inside fetchLatestStatus: " + e);
            }*//*
        }*/

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
	            var funcName = bodyType.replace(/\./g,'_');
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

		        try{
			        new Fiber(function () {
				        Donate.update({'[type]id': id}, {$set: {'[type].status': status}});
			        }).run();
		        } catch(e){
			        Logger.warn(e);
		        }
	        });
	        //Duplicate is intentional and a feature of events that allows us to run multiple events from one call
	        evt.on('update_from_event', function(id, type, status) {
		        logger.info("Got to update_from_event (2nd)");
		        logger.info("(2nd) The ID is: " + id + " The type is: " + type + " This status is: " + status);
		        /*try{*/
			        if (body.events[0].entity[type][0].meta['billy.transaction_guid']) {
				        console.log("Inside If statment");
				        var description = body.events[0].entity[type][0].description;
				        var invoiceID = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
				        new Fiber(function () {
					        var id = Donate.findOne({'recurring.invoice.items.guid': invoiceID})._id;
					        Donate.update({'[type].id': body.events[0].entity[type][0].id});
			            }).run();
			        } else {Logger.info("Nothing to update, not a Billy transaction.")}
		        /*} catch(e){
			        logger.error(e);
		        }*/
	        });
	        //UPDATE STATUS END

			/*************************************************************/
	        /***************         DEBIT AREA             **************/
	        /*************************************************************/
            evt.on('debit_created', function () {
	            logger.info("Got to debit_created");
	            if (body.events[0].entity.debits[0].description !== null) {
		            var description = body.events[0].entity.debits[0].description;
		            logger.info(description);
		            this.emit('debit_update_collection_billy', description);
	            } else {
		            this.emit('debit_update_collection', body.events[0].entity.debits[0].id);
	            }
            });
            evt.on('debit_succeeded', function (status) {
	            logger.info("Got to debit_succeeded");
	            if (body.events[0].entity.debits[0].description !== null) {
		            var description = body.events[0].entity.debits[0].description;
		            logger.info(description);
		            this.emit('debit_update_collection_billy', description);
	            } else {
		            this.emit('debit_update_collection', body.events[0].entity.debits[0].id);
	            }
            });
            evt.on('debit_failed', function (status) {
	            logger.info("Got to the debit_failed func");
	            logger.info(body.events[0].entity.debits[0].description);
	            if (body.events[0].entity.debits[0].description !== null) {
		            var description = body.events[0].entity.debits[0].description;
		            logger.info(description);
		            this.emit('debit_update_collection_billy', description);
	            } else {
		            this.emit('debit_update_collection', body.events[0].entity.debits[0].id);
	            }
            });

	        /*********** Debit update collection events **************/
	        evt.on('debit_update_collection_billy', function (description){
		        logger.info("Got to debit_update_collection_billy");
		        var invoiceID = ("" + description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
		        new Fiber(function() {
			        var id = Donate.findOne({'recurring.invoice.items.guid': invoiceID})._id;
			        Donate.update(id, {$set: {'debit.status': body.events[0].entity.debits[0].status,
				        'debit.id': body.events[0].entity.debits[0].id}});
		        }).run();
	        });
	        evt.on('debit_update_collection', function (debitID){
		        logger.info("Got to debit_update_collection");
		        new Fiber(function() {
			        Donate.update({'debit.id': debitID}, {$set: {'debit.status': body.events[0].entity.debits[0].status}});
		        }).run();
	        });
	        /*************************************************************/
	        /***************         END DEBIT AREA         **************/
	        /*************************************************************/

	        /*************************************************************/
	        /***************         Hold AREA             **************/
	        /*************************************************************/
            evt.on('hold_created', function (status) {
	            logger.info("Got to hold_created");
	            this.emit('update_from_event', body.events[0].entity.card_holds[0].id, 'card_holds',
		            body.events[0].entity.card_holds[0].status);
            });
            evt.on('hold_updated', function (status) {
	            logger.info("Got to hold_updated");
	            this.emit('update_status', body.events[0].entity.card_holds[0].id, 'card_holds',
		            body.events[0].entity.card_holds[0].status);
            });
            evt.on('hold_captured', function (status) {
	            logger.info("Got to hold_captured");
	            this.emit('update_from_event', body.events[0].entity.card_holds[0].id, 'card_holds',
		            body.events[0].entity.card_holds[0].status);
            });
	        /*************************************************************/
	        /***************         END HOLDS AREA         **************/
	        /*************************************************************/

	        evt.on('card_updated', function (status) {
	            console.log("Got to the card_updated func");
            });
            evt.on('card_created', function (status) {
	            console.log("Got to the card_created func");
            });
            evt.on('account_created', function (status) {
	            console.log("Got to the account_created func");
            });
            evt.on('bank_account_updated', function (status) {
	            console.log("Got to the bank_account_updated func");
            });
            evt.on('bank_account_created', function (status) {
	            console.log("Got to the bank_account_created func");
            });

           /* //Send to this event if failed
            evt.on('bank_account_updated', function () {
	            console.log("Got to the bank_account_updated func");
            });

            //Send to this event if succeeded
            evt.on('bank_account_created', function () {
	            console.log("Got to the bank_account_created func");
            });

            //Send to this event if succeeded
            evt.on('bank_account_created', function () {
	            console.log("Got to the bank_account_created func");
            });*/

            //TODO: Map out different request paths, then write the emitters based on these paths.
        }

        /*function debit_created(){
            console.log("Worked");
        };*/
// Check the body otherwise any invalid call to the website would still run any of the events after checking the body.
	        // TODO: This might not be necessary in the long run because I'll be restricting traffic to /events by IP, but this is still good practice
	        body = req.body; //request body
	        try {
		        body.events !== null ? runEvents(body) : noBody();
	        }catch(e) {
		        logger.error(e);
	        }

	        function noBody() {
		        logger.warn('No events found in the body, exited.');
		        res.writeHead(404, {
			        'Content-Type': 'application/json'
		        });
		        res.end("404");//TODO: Remove Got it text, just leave blank when this is live.
	        };


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
