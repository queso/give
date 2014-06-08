// necessary to parse POST data
var connect = Meteor.require('connect');
// necessary for Collection use and other wrapped methods
var Fiber = Npm.require('fibers');
WebApp.connectHandlers
    .use(connect.urlencoded())  // these two replace
    .use(connect.json())        // the old bodyParser
    .use('/callbacks', function(req, res, next) {
 
        // necessary for Collection use and other wrapped methods
        Fiber(function() {
            
            var body = req.body;
            console.log("body: " + body);
            //calls within the code cannot assume that the body will contain certain parts. 
            //first check what exists and then parse based on which kind of response is received. 
            console.log(body.events[0].type);
            
          if (body.events[0].type === "bank_account.created") {
//               console.log("status: " + body.events[0].entity.card_holds[0].status);
//               console.log("card: " + body.events[0].entity.card_holds[0].links.card);
            console.log("bank account: " + testApi.events[0].entity.bank_accounts[0].href);
            console.log("bank account: " + testApi.events[0].entity.bank_accounts[0].id);
            }
          if(body.events[0].type === "account.create") {
            console.log(testApi.events[0].entity.customers[0].href);
            console.log(testApi.events[0].entity.customers[0].id);
          }
            //var user = Meteor.users.findOne(userId);
 
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(); //JSON.stringify(user.profile)
 
        }).run();
    });    
