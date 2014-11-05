_.extend(Utils, {
    create_order: function (id, customerHREF) {
        logger.info("Inside create_order.");
        var order;
        order = Utils.extractFromPromise(balanced.get(customerHREF).orders.create({"Description": "Order #" + id}));

        //add order response from Balanced to the collection
        var orderResponse = Donate.update(id, {$set: {
            'order.description': "Order #" + id
        }});
        logger.info("Finished balanced order create");
        return order;
    },
    debit_order: function (data, order, paymentHref) {
        logger.info("Inside debit_order.");
        var debit;
        //Need to make sure that the number is a whole number, not a decimal
        var total = data.paymentInformation.total_amount;
        var paymentObject = balanced.get(paymentHref);
        debit = Utils.extractFromPromise(balanced.get(order).debit_from(paymentObject, ({ "amount": total,
            "appears_on_statement_as": "Trash Mountain"})));

        //add debit response from Balanced to the database
        var debitReponse = Donate.update(data._id, {$set: {
            'debit.type': debit.type,
            'debit.customer': debit.links.customer,
            'debit.total_amount': debit.amount,
            'debit.id': debit.id,
            'debit.status': debit.status,
            'card_holds.id': debit.links.card_hold,
            'order.id': debit.links.order,
            'credit.sent': false
        }});
        logger.info("Finished balanced order debit");
        return debit;
    },
    credit_order: function(debitID) {
        if(Donate.findOne({'debit.id': debitID, 'credit.sent': {$exists: true}})) {
            //Check to see if this order has already been credited.
            if(!Donate.findOne({'debit.id': debitID}).credit.sent){
                //initialize the balanced function with our API key.
                balanced.configure(Meteor.settings.balanced_api_key);

                logger.info("Inside credit_order.");
                if(Donate.findOne({'debit.id': debitID})) {
                    var name = Donate.findOne({'debit.id': debitID}).customer.fname + " " + Donate.findOne({'debit.id': debitID}).customer.lname;
                    name = name.substring(0, 13);
                    var orderHref = Donate.findOne({'debit.id': debitID}).order.id;
                    orderHref = "/orders/" + orderHref;
                    var bank_account = Utils.extractFromPromise(balanced.get(Meteor.settings.bank_account_uri));

                    var amount = Donate.findOne({'debit.id': debitID}).debit.total_amount;
                    logger.info("Amount from one-time credit order: " + amount);

                    var credit = Utils.extractFromPromise(balanced.get(orderHref).credit_to(bank_account, {"amount": amount,
                        "appears_on_statement_as": name}));
                    Donate.update({'debit.id': debitID}, {$set: {'credit.id': credit.id,
                        'credit.amount': credit.amount,
                        'credit.sent': true}});
                    return credit;
                }
            }
        }
    },
    credit_billy_order: function(id, transaction_guid) {
        //initialize the balanced function with our API key.
        logger.info("Inside credit_billy_order.");
        balanced.configure(Meteor.settings.balanced_api_key);
        logger.info("Transaction GUID: " + transaction_guid);
        logger.info("ID: " + id);
        
        if(Donate.findOne({_id: id})) {
            var name = Donate.findOne({_id: id}).customer.fname + " " + Donate.findOne({_id: id}).customer.lname;

            var amount = Donate.findOne({_id: id}).debit.total_amount;
            logger.info("Amount: " + amount);
            name = name.substring(0, 13);
            var lookup_transaction = Donate.findOne({'transactions.guid': transaction_guid}, {'transactions.$': 1});
            var transaction = _.findWhere(lookup_transaction.transactions, {guid: transaction_guid});
            
            if(transaction && !transaction.credit.sent){    
                logger.info("Credit status was false or not set, starting to send out a credit.");
                //Donate.update({'transactions.guid': transaction_guid}, {$set: {'trasnactions.$.credit.sent': true}});

                var credit = Utils.extractFromPromise(balanced.get(Meteor.settings.bank_account_uri).credit({"appears_on_statement_as": name, "amount": amount}));

                var insert_credit_info = Donate.update({'transactions.guid': transaction_guid}, {$set: {'transactions.$.credit.sent': true, 'transactions.$.credit.amount': credit.amount, 'transactions.$.credit.id': credit.id}});                
            }else{
                logger.info("No need to run the credit again, this transaction has already had it's balance credited.");
                return '';
            }
            return credit;
        }
    }
});