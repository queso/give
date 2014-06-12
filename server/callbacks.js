
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
              
              var updateThis = Donate.findOne({'bank_account.id': postData.id});
              Donate.update(updateThis, {$set: {'bank_account': postData
            }});
              return postData.id;
            }

            function accountWrite(postData) {
              console.log('Callback event received type = account:');
              
              var updateThis = Donate.findOne({'customer.id': postData.entity.customers[0].id});
              Donate.update(updateThis, {$set: {'customer.created': postData.type,
                'customer.edited': new Date().getTime()}});
              return postData.entity.customers[0].id;
            }

            function holdWrite(postData) {
              console.log('Callback event received type = hold:');
              
              var updateThis = Donate.findOne({'hold.id': postData.id});
              Donate.update(updateThis, {$set: {'hold.status': postData.status,
                'hold.updated_at': postData.updated_at
            }});
              return postData.id;
            }
            function cardWrite(postData) {
              console.log('Callback event received type = cards:');
              
              var updateThis = Donate.findOne({'card.id': postData.id});
              Donate.update(updateThis, {$set: {'card': postData
              }});
              return postData.id;
            }

            var body = req.body; //request body
            try {
            var bodyType = body.events[0].type; //What type of event is coming from Balanced?
            } catch(e) {
              console.log(e);
            }

 
            switch (bodyType) {
              case "bank_account.created":
                  var sendToEnd = bank_accountWrite(body.events[0].entity.bank_accounts[0]);
                  break;
              case "bank_account.updated":
                  var sendToEnd = bank_accountWrite(body.events[0].entity.bank_accounts[0]);
                  break;
              case "account.created":
                  var sendToEnd = accountWrite(body.events[0]);
                  break;
              case "card.created":
                  console.log(body.events[0].entity);
                  var sendToEnd = cardWrite(body.events[0].entity.cards[0]);
                  break;
              case "card.updated":
                  console.log(body.events[0].entity);
                  var sendToEnd = cardWrite(body.events[0].entity.cards[0]);
                  break;
              case "debit.created":
                  var sendToEnd = debitWrite(body.events[0]);
                  break;
              case "debit.succeeded":
                  //this area should be used to update the debit and trigger the email send
                  //add another variable here and store the debit.succeeded along with the body info, 
                  //then send this on to the function for calling the email receipt and updating the data.
                  var sendToEnd = debitWrite(body.events[0]);
                  break;
              case "hold.created":
                  var sendToEnd = holdWrite(body.events[0].entity.card_holds[0]);
                  break;
              case "hold.updated":
                  var sendToEnd = holdWrite(body.events[0].entity.card_holds[0]);
                  break;
              case "hold.captured":
                  var sendToEnd = holdWrite(body.events[0].entity.card_holds[0]);
                  break;
              default:
                  console.log("Didn't match any case");
                  var sendToEnd = "No Match";
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
