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
                function getEvents(body) {
                    var e = new EventEmitter();
	                //var a = new EventEmitter();
                    setImmediate(function () {
                        e.emit('start');
                        e.emit('checkBody', body);
                        e.emit('end', body.events[0].type);
                    });
                    return(e);
                }

	            //This function may be needed if it turns out that events are coming in out of order, or if
	            // success and failures are both coming in for the same event types, in which case the client could
	            // get conflicting emails.
	            function fetchLatestStatus(eventID){ //TODO: figure out if this part is even necessary, doesn't seem to do much,
		            //except that it checks the status is correct.
		            /*try {*/
			            fetchStatus = extractFromPromise(balanced.marketplace.get('/events/EVa48561f6274d11e4ae5502d2dca51d8a'));
			            console.log("Status: " + fetchStatus);
			            Donate.update({'events[0].id': eventID}, {$set: {event_status: fetchStatus}});
		            /*}catch(e) {
			            logger.error("Inside fetchLatestStatus: " + e);
		            }*/
	            }

	            // Separated the evt var because otherwise any invalid call to the website would still run any of the
	            // events after checking the body.
	            function runEvents (body) {
		            var evt = getEvents(body);

		            evt.on('start', function () {
			            console.log("Started");
		            });

		            evt.on('checkBody', function (d) {
			            var bodyType = d.events[0].type; //What type of event is coming from Balanced?
			            logger.info('events.js : received an event of type: ' + bodyType);
			            this.emit('select', bodyType);

		            });

		            evt.on('end', function (t) {
			            console.log('Done with ' + t + ' data events.');
			            res.writeHead(200, {
				            'Content-Type': 'application/json'
			            });
			            res.end("Got it");//TODO: Remove Got it text, just leave blank when this is live.
		            });

		            evt.on('select', function (bodyType) {
			            console.log("There was a bodyType " + bodyType);

			            //replace the period in the funcName with an underscore
			            var funcName = bodyType.replace(/\./g,'_');
			            console.log(funcName);

			            //Send to the evt.on of the same name
			            this.emit([funcName]);
		            });

		           /* evt.on('checkBilly', function (baseData) {
			            try {
				            var getBillyInvoiceID = baseData.meta["billy.transaction_guid"] != null ? findBillyInvoiceID(baseData) :  false;
				            return getBillyInvoiceID;

				            function findBillyInvoiceID(baseData) {
					            //return the last word in the description, which is the invoice ID.
					            return ("" + baseData.description).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
				            }

			            }catch(e) {
				            logger.error(e);
			            }

		            });

		            evt.on('checkFailed', function (refFunc) {
			           *//* body.events[0].entity.[refFunc] = req.body; //request body
			            try {
				            body.events[0]. != null ? runEvents(body) : noBody();
			            }catch(e) {
				            logger.error(e);
			            }

			            d && This()*//*
		            });*/

		            evt.on('debit_created', function () {
			            console.log("Got to the debit_created func"); //TODO: Remove

			            var debitID = body.events[0].entity.debits[0].id;
			            console.log(debitID);

			            // Put this event into the document linked to the passed id and into the debit_status property.
			            new Fiber(function() {
				            Donate.update({'debit.id': debitID},
					            {$push: {events: body}
					            });
			            }).run();

			            /*var baseData = body.events[0].entity.debits[0];
			            function runChecks() {
				            var billy = this.emit('checkBilly', baseData);
				            //var failed = this.emit('checkFailed', 'debits', baseData);
			            }

			            (billy == false) ? addRecord(false) : (status == true) ? runTrue() : runFalse();*/

		            });
		            evt.on('debit_succeeded', function (status) {
			            console.log("Got to the debit_succeeded func"); //TODO: Remove

			            var debitID = body.events[0].entity.debits[0].id;
			            console.log(debitID);

			            // Put this event into the document linked to the passed id and into the debit_status property.
			            new Fiber(function() {
				            Donate.update({'debit.id': debitID},
					            {$push: {events: body}
					            });

				            fetchLatestStatus(body.events[0].id);
			            }).run();



		            });
		            evt.on('debit_failed', function (status) {
			            console.log("Got to the debit_failed func"); //TODO: Remove

			            var debitID = body.events[0].entity.debits[0].id;
			            console.log(debitID);

			            // Put this event into the document linked to the passed id and into the debit_status property.
			            new Fiber(function() {
				            Donate.update({'debit.id': debitID},
					            {$push: {events: body}
					            });
			            }).run();

		            });
		            evt.on('hold_created', function (status) {
			            console.log("Got to the hold_created func");
		            });
		            evt.on('hold_updated', function (status) {
			            console.log("Got to the hold_updated func");
		            });
		            evt.on('hold_captured', function (status) {
			            console.log("Got to the hold_captured func");
		            });
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


	            var body = req.body; //request body
	            try {
		            body.events != null ? runEvents(body) : noBody();
	            }catch(e) {
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
