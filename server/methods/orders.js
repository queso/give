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