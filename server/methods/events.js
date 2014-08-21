var bodyParser = Meteor.require('body-parser');
// Fiber is necessary for Collection use and other wrapped methods
var Fiber = Npm.require('fibers');
var EventEmitter = Npm.require('events').EventEmitter;
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
			            console.log(body);
			            /*var sendTo = */
			            var funcName = bodyType.replace(/\./g,'_');
			            console.log(funcName);
			            //var testMe = JSONSelect(body.events[0].entity:first-child); //TODO: would really like to find
			            //the equivalent of this.
			            //this.emit([funcName], ; //Then pass that to the func name as an arg. 
			            //console.log("Function is now " + sendTo);
			            //bodyType();
		            });
		            evt.on('debit_created', function (status) {
			            console.log("Got to the debit_created func");
		            });
		            evt.on('debit_succeeded', function (status) {
			            console.log("Got to the debit_succeeded func");
		            });
		            evt.on('debit_failed', function (status) {
			            console.log("Got to the debit_failed func");
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
		            if (body.events != null) {
			            runEvents(body);
		            } else {
			            noBody();
		            }
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
      // var events = new Npm.require(events).EventEmitter;
      // events.on("bank_account.created", bank_accountWrite);
      // events.emit(bodyType, body.events[0]);*/
