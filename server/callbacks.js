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
            
          //bank accounts events
          if (body.events[0].type === "bank_account.created") {
            console.log("bank account: " + body.events[0].entity.bank_accounts[0].href);
            console.log("bank account: " + body.events[0].entity.bank_accounts[0].id);
            var sendToEnd = body.events[0].entity.bank_accounts[0].id;
            }
          if (body.events[0].type === "bank_account.updated") {
            console.log("bank account: " + body.events[0].entity.bank_accounts[0].href);
            console.log("bank account: " + body.events[0].entity.bank_accounts[0].id);
            var sendToEnd = body.events[0].entity.bank_accounts[0].id;
          }

          //customer events
          if(body.events[0].type === "account.created") {
            console.log(body.events[0].entity.customers[0].href);
            console.log(body.events[0].entity.customers[0].id);
            var sendToEnd = body.events[0].entity.customers[0].id;
          }

          //card events
          if(body.events[0].type === "card.created") {
            console.log(body.events[0].entity);
            var sendToEnd = body.events[0].entity;
          }

          //charge events
          if(body.events[0].type === "debit.created") {
            console.log(body.events[0].entity.debits[0].href);
            console.log(body.events[0].entity.debits[0].id);
            var sendToEnd = body.events[0].entity.debits[0].id;
          } 
          if(body.events[0].type === "debit.succeeded") {
            console.log(body.events[0].entity.debits[0].href);
            console.log(body.events[0].entity.debits[0].id);
            var sendToEnd = body.events[0].entity.debits[0].id;
          }

          //hold events
          if (body.events[0].type === "hold.created") {
            console.log("holds: " + body.events[0].entity.card_holds[0].href);
            console.log("holds: " + body.events[0].entity.card_holds[0].id);
            var sendToEnd = body.events[0].entity.card_holds[0].id;
          }
          if (body.events[0].type === "hold.updated") {
            console.log("holds: " + body.events[0].entity.card_holds[0].href);
            console.log("holds: " + body.events[0].entity.card_holds[0].id);
            var sendToEnd = body.events[0].entity.card_holds[0].id;
          }
          if ((body.events[0].type) === "hold.captured") {
            console.log("holds: " + body.events[0].entity.card_holds[0].href);
            console.log("holds: " + body.events[0].entity.card_holds[0].id);
            var sendToEnd = body.events[0].entity.card_holds[0].id;
          }
 
            res.writeHead(200, {'Content-Type': 'application/json'});
            if (sendToEnd) {
              res.end(sendToEnd); //JSON.stringify(user.profile)
            } else {
              res.end();
            }

 
        }).run();
    });    
