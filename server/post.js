// necessary to parse POST data
var connect = Meteor.require('connect');
// necessary for Collection use and other wrapped methods
var Fiber = Npm.require('fibers');
WebApp.connectHandlers
    .use(connect.urlencoded())  // these two replace
    .use(connect.json())        // the old bodyParser
    .use('/post', function(req, res, next) {
 
        // necessary for Collection use and other wrapped methods
        Fiber(function() {
 
            var userId = req.body.userId;
            var user = Meteor.users.findOne(userId);
 
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(user.profile));
 
        }).run();
    });    
