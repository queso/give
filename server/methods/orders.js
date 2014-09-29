_.extend(Utils, {
    create_order: function (id, customerHREF) {
        logger.info("Inside create_order.");
        var order;
        order = Utils.extractFromPromise(balanced.get(customerHREF).orders.create({"Description": "Order #" + id}));

        //add order response from Balanced to the collection
        var orderResponse = Donate.update(id, {$set: {
            'order.description': "Order #" + id
        }});
        console.log("Finished balanced order create");
        return order;
    },
    debit_order: function (data, order, paymentObject) {
        logger.info("Inside debit_order.");
        var debit;
        //Need to make sure that the number is a whole number, not a decimal
        var total = data.paymentInformation[0].total_amount;
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

        }});
        console.log("Finished balanced order debit");
        return debit;
    },
    credit_order: function(debitID) {
        //initialize the balanced function with our API key.
        balanced.configure(Meteor.settings.balanced_api_key);

        logger.info("Inside credit_order.");
        var name = Donate.findOne({'debit.id': debitID}).customer.fname + " " + Donate.findOne({'debit.id': debitID}).customer.lname;
        name = name.substring(0, 13);
        var orderHref = Donate.findOne({'debit.id': debitID}).order.id;
        orderHref = "/orders/" + orderHref;
        var bank_account = Utils.extractFromPromise(balanced.get(Meteor.settings.bank_account_uri));

        var amount = Donate.findOne({'debit.id': debitID}).debit.total_amount;
        console.log("Amount from one-time credit order: " + amount);

        var credit = Utils.extractFromPromise(balanced.get(orderHref).credit_to(bank_account, {"amount": amount,
            "appears_on_statement_as": name}));
        Donate.update({'debit.id': debitID}, {$set: {'credit.id': credit.id,
            'credit.amount': credit.amount}});
        return credit;
    },
    credit_billy_order: function(id, transaction_guid) {
        //initialize the balanced function with our API key.
        logger.info("Inside credit_billy_order.");
        balanced.configure(Meteor.settings.balanced_api_key);
        logger.info("Transaction GUID: " + transaction_guid);
        logger.info("ID: " + id);
        
        var name = Donate.findOne({_id: id}).customer.fname + " " + Donate.findOne({_id: id}).customer.lname;
        //Need to make sure that the number is a whole number, not a decimal
        var amount = Donate.findOne({_id: id}).debit.total_amount;

        name = name.substring(0, 13);
        var lookup_credit_status = {};
        lookup_credit_status['recurring.transactions.' + transaction_guid + '.credit.sent'] = true;
        
        if(Donate.findOne(lookup_credit_status)){    
            logger.info("No need to run the credit again, this transaction has already had it's balance credited.");
            return '';

        }else{
            logger.info("Credit status was false or not set, starting to send out a credit.");
            var setModifier = { $set: {} };
                setModifier.$set['recurring.transactions.' + transaction_guid + '.credit'] = {sent: true};
                Donate.update({_id: id}, setModifier);

            var credit = Utils.extractFromPromise(balanced.get(Meteor.settings.bank_account_uri).credit({"appears_on_statement_as": name, "amount": amount}));

            var setModifierAgain = { $set: {} };
                setModifierAgain.$set['recurring.transactions.' + transaction_guid + '.credit'] = {'amount': credit.amount, 'id': credit.id, 'sent': true};
                Donate.update({_id: id}, setModifierAgain);
        }
            
        return credit;
    }
});