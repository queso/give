_.extend(Utils, {
    create_order: function (id, customerHREF) {
        logger.info("Inside create_order.");
        var order = Utils.extractFromPromise(balanced.get(customerHREF).orders.create({"Description": "Order #" + id})); //TODO: Need to adjust this to be more specific since I might have many orders from one id
        console.log(order._api.cache[order.href]);

        //add order response from Balanced to the collection
        var orderResponse = Donations.update(id, {
            $set: {
                'order': order._api.cache[order.href]
            }
        });
        logger.info("Finished balanced order create");

        return order;
    },
    debit_order: function (total, donation_id, customer_id, order, paymentHref) {
        logger.info("Inside debit_order.");
        var debit;
        var paymentObject = balanced.get(paymentHref);
        //TODO: run tests against the amount value to make sure it is always correct
        debit = Utils.extractFromPromise(balanced.get(order).debit_from(paymentObject, ({ "amount": total,
            "appears_on_statement_as": "Trash Mountain"})));

        console.log(debit._api.cache[debit.href]);
        var debit_insert = debit._api.cache[debit.href];
        console.dir(debit_insert)
        debit_insert.donation_id = donation_id;
        debit_insert.customer_id = customer_id;
        debit_insert._id = debit_insert.id;

        //add debit response from Balanced to the database
        Debits.insert(debit_insert);
        logger.info("Finished balanced order debit. Debits ID: " + debit_insert.id);
        return debit_insert.id;
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
                    console.log(credit._api.cache[credit.href]);
                    Donate.update({'debit.id': debitID}, {$set: {'credit.id': credit.id,
                        'credit.amount': credit.amount,
                        'credit.sent': true}});
                    return credit;
                }
            }
        }
    }
});