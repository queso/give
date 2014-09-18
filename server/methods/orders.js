var Future = Meteor.npmRequire("fibers/future");
function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
        fut.return(result);
    }, function (error) {
        logger.info("Error from promise area: " + error);
        logger.info(error.message);
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
            'card_holds.id': debit.links.card_hold,
            'order.id': debit.links.order,

        }});
        console.log("Finished balanced order debit");
        return debit;
    },
    credit_order: function(debitID) {
        logger.info("Inside credit_order.");
        console.log(debitID);
        var orderHref = Donate.findOne({'debit.id': debitID}).order.id;
        orderHref = "/orders/" + orderHref;
        var bank_account = extractFromPromise(balanced.get(Meteor.settings.devBankAccount));

        var order = extractFromPromise(balanced.get(orderHref));
        var amount_escrowed = order.amount_escrowed;
        console.log(amount_escrowed);

        var credit = extractFromPromise(balanced.get(orderHref).credit_to(bank_account, amount_escrowed));
        logger.info("Completed credit call to Balanced.");
        return credit;
    },
    credit_billy_order: function(debitID) {
        logger.info("Inside credit_order.");
        console.log(debitID);
        var name = Donate.findOne({'debit.id': debitID}).customer.fname + " " + Donate.findOne({'debit.id': debitID}).customer.lname;
        name = string.substring(0, 13);
        var bank_account = extractFromPromise(balanced.get(Meteor.settings.devBankAccount).credit({"appears_on_statement_as": name}));

        var order = extractFromPromise(balanced.get(orderHref));
        var amount_escrowed = order.amount_escrowed;
        console.log(amount_escrowed);

        var credit = extractFromPromise(balanced.get(orderHref).credit_to(bank_account, amount_escrowed));
        logger.info("Completed credit call to Balanced.");
        return credit;
    }
});