
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
            
            function debitWrite(postData) {
              console.log('Callback event received type = debit');
              
              var updateThis = Donate.findOne({'debit.id': postData.entity.debits[0].id})._id;
              Donate.update(updateThis, {$set: {'debit.created': postData.type,
                'debit.edited': new Date().getTime()}});
              //if (postData.entity.debits[0].status === "debit.succeeded") {
                Donate.update(updateThis, {$set: {'debit.status': 'succeeded',
                  'debit.email_sent': 'sending'}});
                
              //}
              return postData.entity.debits[0].id;
            }

            function bank_accountWrite(postData) {
              console.log('Callback event received type = bank_account');
              
              var updateThis = Donate.findOne({'bank_account.id': postData.entity.bank_accounts[0].id});
              Donate.update(updateThis, {$set: {'bank_account.edited': new Date().getTime()}});
              return postData.entity.bank_accounts[0].id;
            }

            function accountWrite(postData) {
              console.log('Coming from accountWrite call:');
              
              var updateThis = Donate.findOne({'customer.id': postData.entity.customers[0].id});
              Donate.update(updateThis, {$set: {'customer.created': postData.type,
                'customer.edited': new Date().getTime()}});
              return postData.entity.customers[0].id;
            }

            function holdWrite(postData) {
              console.log('Coming from holdWrite call:');
              
              var updateThis = Donate.findOne({'customer.id': postData.entity.customers[0].id});
              Donate.update(updateThis, {$set: {'customer.created': postData.type,
                'customer.edited': new Date().getTime()}});
              return postData.entity.customers[0].id;
            }

            var body = req.body; //request body
            var bodyType = body.events[0].type; //What type of event is coming from Balanced?

 
            switch (bodyType) {
              case "bank_account.created":
                  var sendToEnd = bank_accountWrite(body.events[0]);
                  break;
              case "bank_account.updated":
                  var sendToEnd = bank_accountWrite(body.events[0]);
                  break;
              case "account.created":
                  var sendToEnd = accountWrite(body.events[0]);
                  break;
              case "card.created":
                  console.log(body.events[0].entity);
                  var sendToEnd = body.events[0].entity;
                  break;
              case "debit.created":
                  var sendToEnd = debitWrite(body.events[0]);
                  break;
              case "debit.succeeded":
                  var sendToEnd = debitWrite(body.events[0]);
                  break;
              case "hold.created":
                  var sendToEnd = holdWrite(body.events[0]);
                  break;
              case "hold.updated":
                  var sendToEnd = holdWrite(body.events[0]);
                  break;
              case "hold.captured":
                  var sendToEnd = holdWrite(body.events[0]);
                  break;
        }
          
          if (sendToEnd) {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(sendToEnd); //JSON.stringify(user.profile)
          } else {
            res.end();
          }

 
        }).run();
    });    
