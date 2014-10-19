var bodyParser = Meteor.npmRequire('body-parser');
var EventEmitter = Meteor.npmRequire('events').EventEmitter;

WebApp.connectHandlers.use(bodyParser.urlencoded({
    extended: false}))
    .use(bodyParser.json())
    .use('/event_controller', Meteor.bindEnvironment(function(req, res, next) {

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
                logger.info("**********Received an event");
                logger.info('Body type: ' + body.events[0].type);
                if (billy) {
                    logger.info("Billy Event received.");
                    e.emit('start', true, body);
                    logger.info("This runs after Evts.recurring_controller call");
                }else {
                    logger.info("Non-Billy Event received.");
                    e.emit('start', false, body);
                    logger.info("This runs after Evts.recurring_controller call");
                }
                e.emit('end', body.events[0].type);
            });
            return(e);
        }

        //Get Events started
        function runEvents (body, billy, type) {
            var evt = getEvents(body, billy, type);
            evt.on('end', function (type) {
                logger.info('Done with ' + type + ' data events.');
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end("Got it");//TODO: Remove Got it text, just leave blank when this is live.
            });
            evt.on('start', function (billy, body) {
                if(billy){
                    var send_to_recurring = Evts.recurring_controller(body);
                } else {
                    var send_to_one_time = Evts.one_time_controller(body);
                }
            });
        }
        
        var body = req.body; //request body

        /*try {*/
                body.events ? check_body(body) : noBody();
            /*} catch (e) {
                logger.error(e);
            }*/

            function check_body(body) {
                var type = Object.keys(body.events[0].entity)[0];
                logger.info("Type = " + type);
                console.log(moment.utc().format('MM/DD/YYYY, hh:mm'));
                if(type === 'links'){
                    var billy = false;
                    type = body.events[0].type;
                } 
                else if(body.events[0].entity[type][0].meta) {
                    var billy =  Boolean(body.events[0].entity[type][0].meta['billy.transaction_guid']);
                } else{
                    var billy = false;
                }
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
