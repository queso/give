//Make sure to fix the callback responses, they should all be blank, no matter what goes in. 
//Need to make sure that a 200 response isn't sent for some kind of failure on this end, otherwise that request 
//will never come back to this side
// necessary to parse POST data

function logIt() {
  logger.info("Started " + arguments.callee.caller.name);
}

var bodyParser = Meteor.require('body-parser');
// necessary for Collection use and other wrapped methods
var Fiber = Npm.require('fibers');
WebApp.connectHandlers.use(bodyParser.urlencoded({
    extended: false
  })) // these two replace
  .use(bodyParser.json()) // the old bodyParser
  .use('/callbacks/', function(req, res, next) {
    // necessary for Collection use and other wrapped methods
    Fiber(function() {
      function lastWord(o) {
        logIt();
        return ("" + o).replace(/[\s-]+$/, '').split(/[\s-]/).pop();
      };

      function debitWrite(postData) {
          try {
            logIt();
            logger.info('Callback.js : event received type = ' + postData.type + " ID: " + postData.debitID);
            var updateThis;
          
            if (!postData.billy) {
              logger.info("Callback.js : Entered the debitID exists section with debitID of: " + postData.debitID);
              updateThis = Donate.findOne({
                'debit.id': postData.debitID
              })._id;
            } else {
              logger.info("Callback.js : Entered the debitID does NOT exists section with debitID of: " + postData.debitID);
              //updateThis = Donate.findOne({'recurring.subscription.guid': postData.links.debitID})._id;
              updateThis = Donate.findOne({
                'recurring.invoice.items.guid': postData.billy
              })._id;
              Donate.update(updateThis, {
                $set: {
                  'debit.id': postData.debitID
                }
              });
              logger.info("Callback.js : Invoice area id: " + updateThis);
            }
            //if the debit was successful updated the debit status in the database and then 
            //run the Mandrill email function to send a receipt to the donor
            if (postData.status === "succeeded" && !(Donate.findOne(updateThis).debit.email_sent)) {
              logger.info('Callback.js : Tell the system not to send an email after this one.')
              Donate.update(updateThis, {
                $set: {
                  'debit.email_sent': true
                }
              });
              Donate.update(updateThis, {
                $set: {
                  'debit.status': 'succeeded',
                  'debit.email_sent': 'sending'
                }
              });
              logger.ingo("Callback.js : Sending out the appropriate email using Mandrill");
              Meteor.call('sendEmailOutAPI', updateThis, function(error, result) {
                logger.info('Callback.js : 'error, result);
              });
            } else if (postData.status === "created") {
              Donate.update(updateThis, {
                $set: {
                  'debit.status': postData.status,
                  'debit.edited': new Date().getTime()
                }
              });
            } else if (postData.status === "failed" && !(Donate.findOne(updateThis).debit.email_sent)) {
              Donate.update(updateThis, {
                $set: {
                  'debit.email_sent': true
                }
              });
              Donate.update(updateThis, {
                $set: {
                  'debit.status': 'failed',
                  'debit.email_sent': 'sending'
                }
              });
              logger.warning('Callback.js : Sending out the failed email using Mandrill.');
              Meteor.call('sendEmailOutAPI', updateThis, function(error, result) {
                logger.info('Callback.js : 'error, result);
              });
            }
            return postData.id;
          } catch (e) {
            var searchForThis = postData.debitID;
            logger.error('Callback.js catch error area: 'Donate.find({
              $text: {
                $search: searchForThis
              }
            }));
            logger.error('Callback.js catch error area: There was a problem inside the try statement for the debitWrite function: ' + e.message);
            logger.error('Callback.js catch error area: Wrote 500 header')
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });
          }
        }
        //END debitWrite function

      function bank_accountWrite(postData) {
          logIt();
          logger.info('Callback.js : event received type = bank_account:');
          var updateThis = Donate.findOne({
            'bank_account.id': postData.id
          });
          Donate.update(updateThis, {
            $set: {
              'bank_account': postData
            }
          });
          return postData.id;
        }
        //END bank_accountWrite function

      function accountWrite(postData) {
          logIt();
          logger.info('Callback.js : event received type = account:');
          var updateThis = Donate.findOne({
            'customer.id': postData.entity.customers[0].id
          });
          Donate.update(updateThis, {
            $set: {
              'customer.created': postData.type,
              'customer.edited': new Date().getTime()
            }
          });
          return postData.entity.customers[0].id;
        }
        //END accountWrite function

      function holdWrite(postData) {
          logIt();
          logger.info('Callback.js : event received type = hold:');
          var updateThis = Donate.findOne({
            'hold.id': postData.id
          });
          Donate.update(updateThis, {
            $set: {
              'hold.status': postData.status,
              'hold.updated_at': postData.updated_at
            }
          });
          return postData.id;
        }
        //END holdWrite function

      function cardWrite(postData) {
          logIt();
          logger.info('Callback.js : event received type = cards:');
          var updateThis = Donate.findOne({
            'card.id': postData.id
          });
          Donate.update(updateThis, {
            $set: {
              'card': postData
            }
          });
          return postData.id;
        }
        //END cardWrite function
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
            logger.info(body.events[0].entity);
            var sendToEnd = cardWrite(body.events[0].entity.cards[0]);
            break;
          case "card.updated":
            logger.info(body.events[0].entity);
            var sendToEnd = cardWrite(body.events[0].entity.cards[0]);
            break;
          case "debit.created":
            /*logger.info("Let's see what is actually showing up in the body type: " + bodyType);
                  var sendToWriteFunction = [];
                  sendToWriteFunction.debitID = body.events[0].entity.debits[0].id;
                  sendToWriteFunction.status = body.events[0].entity.debits[0].status;
                  sendToWriteFunction.type = "created";
                  sendToWriteFunction.links = body.events[0].entity.debits[0].links;
                  if (body.events[0].entity.debits[0].description) {
                    var billyInvoiceID = lastWord(body.events[0].entity.debits[0].description);
                    logger.info("Billy invoice ID seperated from the sentence 000000000000000000000000000000 " + billyInvoiceID);
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
            if (bodyType === "debit.succeeded") {
              sendToWriteFunction.type = "succeeded";
            } else {
              sendToWriteFunction.type = "failed";
            }
            sendToWriteFunction.links = body.events[0].entity.debits[0].links;
            if (body.events[0].entity.debits[0].description) {
              var billyInvoiceID = lastWord(body.events[0].entity.debits[0].description);
              logger.info("Callback.js : Billy invoice ID seperated from the sentence 000000000000000000000000000000 " + billyInvoiceID);
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
            logger.warning("Callback.js : The last callback event received didn't match any case.");
            var sendToEnd = "";
            break;
        }
      } catch (e) {
        logger.error("Callback.js : Error in switch: " + e.message);
      }
      if (sendToEnd) {
        res.writeHead(200, {
          'Content-Type': 'application/json'
        }); 
        res.end(sendToEnd);
      } else {
        res.end();
      }
    }).run();
  });