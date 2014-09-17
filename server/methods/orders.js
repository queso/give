var Future = Meteor.npmRequire("fibers/future");
function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
        fut.return(result);
    }, function (error) {
        logger.info("Error from promise area: " + error);
        fut.throw(error);
    });
    return fut.wait();
}

_.extend(Utils, {
    create_order: function (id, customerHREF) {
        logger.info("Inside create_order.");
        var order;
        order = extractFromPromise(balanced.get(customerHREF).orders.create({"Description": "Order #" + id}));

        //add order response from Balanced to the collection
        var orderResponse = Donate.update(id, {$set: {
            'order.description': "Order #" + id
        }});
        console.log("Finished balanced order create");
        console.log(order);
        return order;
    },
    debit_order: function (data, order, paymentObject) {
        logger.info("Inside debit_order.");
        var debit;
        debit = extractFromPromise(balanced.get(order).debit_from(paymentObject, ({ "amount": data.paymentInformation[0].total_amount * 100,
            "appears_on_statement_as": "Trash Mountain"})));

        //add debit response from Balanced to the database
        var debitReponse = Donate.update(data._id, {$set: {
            'debit.type': debit.type,
            'debit.customer': debit.links.customer,
            'debit.total_amount': debit.amount / 100,
            'debit.id': debit.id,
            'debit.status': debit.status,
            'card_holds.id': debit.links.card_hold
        }});
        console.log("Finished balanced order debit");
        return debit;
    },
    credit_order: function(order, paymentObject) {
        logger.info("Inside credit_order.");
        console.log(order);
        var credit;
        credit = extractFromPromise(balanced.get(order).credit_to("/bank_accounts/" + Meteor.settings.devBankAccount + "/credits", 103));
        logger.info("This is what Balanced sent back for the credit_order, credit_to call. " + credit);
        return credit;
    }
});