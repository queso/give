//Make sure to fix the callback responses, they should all be blank, no matter what goes in. 
//Need to make sure that a 200 response isn't sent for some kind of failure on this end, otherwise that request 
//will never come back to this side

// necessary to parse POST data
var connect = Meteor.require('connect');
// necessary for Collection use and other wrapped methods
var Fiber = Npm.require('fibers');
WebApp.connectHandlers
    .use(connect.urlencoded())  // these two replace
    .use(connect.json())        // the old bodyParser
    .use('/give/callbacks', function(req, res, next) {
 
        // necessary for Collection use and other wrapped methods
        Fiber(function() {
            function lastWord(o) {
              return (""+o).replace(/[\s-]+$/,'').split(/[\s-]/).pop();
            };
            function debitWrite(postData) {
              console.log('Callback event received type = debit: ' + postData.type + " ID: " + postData.debitID);
              var updateThis;
              try {
                if (!postData.billy) {
                  console.log("Entered the debitID exists section with debitID of: " + postData.debitID);
                updateThis = Donate.findOne({'debit.id': postData.debitID})._id;
              } else {
                console.log("Entered the debitID does NOT exists section with debitID of: " + postData.debitID);
                //updateThis = Donate.findOne({'recurring.subscription.guid': postData.links.debitID})._id;
                updateThis = Donate.findOne({'recurring.invoice.items.guid': postData.billy})._id;
                Donate.update(updateThis, {$set: {'debit.id': postData.debitID}});
                console.log("Invoice area id: " + updateThis);
              }

                //if the debit was successful updated the debit status in the database and then 
                //run the Mandrill email function to send a receipt to the donor
                if (postData.status === "succeeded" && !(Donate.findOne(updateThis).debit.email_sent) ) { 
                  Donate.update(updateThis, {$set: {'debit.email_sent': true}});
                  console.log("debit write area")
                  Donate.update(updateThis, {$set: {'debit.status': 'succeeded',
                    'debit.email_sent': 'sending'}});

                  //send out the appropriate email using Mandrill
                  Meteor.call('sendEmailOutAPI', updateThis, function (error, result) {
                    console.log(error, result);
                  });
                  
                } else if (postData.status === "created") {
                   Donate.update(updateThis, {$set: {'debit.status': postData.status,
                  'debit.edited': new Date().getTime()}});
                } else if (postData.status === "failed" && !(Donate.findOne(updateThis).debit.email_sent)) {
                  Donate.update(updateThis, {$set: {'debit.email_sent': true}});
                  Donate.update(updateThis, {$set: {'debit.status': 'failed',
                    'debit.email_sent': 'sending'}});
                  //send out the appropriate email using Mandrill
                  Meteor.call('sendEmailOutAPI', updateThis, function (error, result) {
                    console.log(error, result);
                  });
                }
                return postData.id;
              }
              catch (e) {
                console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                var searchForThis = postData.debitID;
                console.log(Donate.find( { $text: { $search: searchForThis } } ));
                console.log("There was a problem inside the try statement for the debitWrite function: " + e.message);
                res.writeHead(500, {'Content-Type': 'application/json'});
              }
            }
            //END debitWrite function
           
            function bank_accountWrite(postData) {
              console.log('Callback event received type = bank_account:');
              
              var updateThis = Donate.findOne({'bank_account.id': postData.id});
              Donate.update(updateThis, {$set: {'bank_account': postData
            }});
              return postData.id;
            }
            //END bank_accountWrite function

            function accountWrite(postData) {
              console.log('Callback event received type = account:');
              
              var updateThis = Donate.findOne({'customer.id': postData.entity.customers[0].id});
              Donate.update(updateThis, {$set: {'customer.created': postData.type,
                'customer.edited': new Date().getTime()}});
              return postData.entity.customers[0].id;
            }
            //END accountWrite function

            function holdWrite(postData) {
              console.log('Callback event received type = hold:');
              
              var updateThis = Donate.findOne({'hold.id': postData.id});
              Donate.update(updateThis, {$set: {'hold.status': postData.status,
                'hold.updated_at': postData.updated_at
            }});
              return postData.id;
            }
            //END holdWrite function

            function cardWrite(postData) {
              console.log('Callback event received type = cards:');
              
              var updateThis = Donate.findOne({'card.id': postData.id});
              Donate.update(updateThis, {$set: {'card': postData
              }});
              return postData.id;
            }
            //END cardWrite function

            var body = req.body; //request body
            try {
            var bodyType = body.events[0].type; //What type of event is coming from Balanced?
            console.log('received an event ' + bodyType );
            } catch(e) {
              console.log(e);
            }
 
          // var events = new Npm.require(events).EventEmitter;
          // events.on("bank_account.created", bank_accountWrite);
          // events.emit(bodyType, body.events[0]);
          try {
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
                  /*console.log("Let's see what is actually showing up in the body type: " + bodyType);
                  var sendToWriteFunction = [];
                  sendToWriteFunction.debitID = body.events[0].entity.debits[0].id;
                  sendToWriteFunction.status = body.events[0].entity.debits[0].status;
                  sendToWriteFunction.type = "created";
                  sendToWriteFunction.links = body.events[0].entity.debits[0].links;
                  if (body.events[0].entity.debits[0].description) {
                    var billyInvoiceID = lastWord(body.events[0].entity.debits[0].description);
                    console.log("Billy invoice ID seperated from the sentence 000000000000000000000000000000 " + billyInvoiceID);
                    sendToWriteFunction.billy = billyInvoiceID;
                  }*/
                  var sendToEnd; //debitWrite(sendToWriteFunction);
                  break;
              case "debit.failed":
              case "debit.succeeded":
                  //this area should be used to update the debit and trigger the email send
                  //add another variable here and store the debit.succeeded along with the body info, 
                  //then send this on to the function for calling the email receipt and updating the data.
                  var sendToWriteFunction = [];
                  sendToWriteFunction.debitID = body.events[0].entity.debits[0].id;
                  sendToWriteFunction.status = body.events[0].entity.debits[0].status;
                  if (bodyType == "debit.succeeded") {
                    sendToWriteFunction.type = "succeeded";
                  } else {
                    sendToWriteFunction.type = "failed";
                  }
                  sendToWriteFunction.links = body.events[0].entity.debits[0].links;
                  if (body.events[0].entity.debits[0].description) {
                    var billyInvoiceID = lastWord(body.events[0].entity.debits[0].description);
                    console.log("Billy invoice ID seperated from the sentence 000000000000000000000000000000 " + billyInvoiceID);
                    sendToWriteFunction.billy = billyInvoiceID;
                  }
                  var sendToEnd = debitWrite(sendToWriteFunction);
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
                  console.log("The last callback event received didn't match any case.");
                  var sendToEnd = "";
                  break;
              }
            }
            catch(e) {
              console.log("Error in switch: " + e.message);
            }
          if (sendToEnd) {
            res.writeHead(200, {'Content-Type': 'application/json'}); //Need to make sure that the 200 is only sent if the record is found
            //otherwise balanced won't keep trying to send to us. Need to get all the errors at the beginning and send an email or I need
            //to use the allerrors collection to view all errors and resolve
            res.end(sendToEnd); //JSON.stringify(user.profile)
          } else {
            res.end();
          } 
        }).run();
    });    
