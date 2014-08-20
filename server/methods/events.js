var bodyParser = Meteor.require('body-parser');
// necessary for Collection use and other wrapped methods
var Fiber = Npm.require('fibers');
var EventEmitter = Npm.require('events').EventEmitter;
    WebApp.connectHandlers.use(bodyParser.urlencoded({
        extended: false
    })) // these two replace
        .use(bodyParser.json()) // the old bodyParser
        .use('/events/', function(req, res, next) {
            // necessary for Collection use and other wrapped methods
            Fiber(function() {
                function getEvents(c) {
                    var e = new EventEmitter();
                    setImmediate(function () {
                        e.emit('start');
                        e.emit('data', c);
                        e.emit('end');
                    });
                    return(e);
                }
				var body = req.body;
                var evt = getEvents(body);

                evt.on('start', function () {
                    console.log("Started");
                });

                evt.on('data', function (d) {
		            //What type of event is coming from Balanced?
		            //var bodyType = d.events[0].type;
			        logger.info('Callback.js : received an event of type: ' + d);

                });

                evt.on('end', function (t) {
                    console.log('Done with ' + t + ' data events.');
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.end("Got it");//TODO: Remove Got it text, just leave blank when this is live. 
                });
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
