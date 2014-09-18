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
        debit = Utils.extractFromPromise(balanced.get(order).debit_from(paymentObject, ({ "amount": data.paymentInformation[0].total_amount * 100,
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
        //initialize the balanced function with our API key.
        balanced.configure(Meteor.settings.balancedPaymentsAPI);

        logger.info("Inside credit_order.");
        var name = Donate.findOne({'debit.id': debitID}).customer.fname + " " + Donate.findOne({'debit.id': debitID}).customer.lname;
        name = name.substring(0, 17);
        var orderHref = Donate.findOne({'debit.id': debitID}).order.id;
        orderHref = "/orders/" + orderHref;
        var bank_account = Utils.extractFromPromise(balanced.get(Meteor.settings.devBankAccount));

        var order = Utils.extractFromPromise(balanced.get(orderHref));
        var amount_escrowed = order.amount_escrowed;

        var credit = Utils.extractFromPromise(balanced.get(orderHref).credit_to(bank_account, {"amount": amount_escrowed,
            "appears_on_statement_as": name}));
        Donate.update({'debit.id': debitID}, {$set: {'credit.id': credit.id,
            'credit.amount': credit.amount}});
        return credit;
    },
    credit_billy_order: function(debitID) {
        //initialize the balanced function with our API key.
        balanced.configure(Meteor.settings.balancedPaymentsAPI);

        logger.info("Inside credit_order.");
        var name = Donate.findOne({'debit.id': debitID}).customer.fname + " " + Donate.findOne({'debit.id': debitID}).customer.lname;
        var amount = Donate.findOne({'debit.id': debitID}).debit.total_amount * 100;
        name = name.substring(0, 17);

        var credit = Utils.extractFromPromise(balanced.get(Meteor.settings.devBankAccounts).credit({"appears_on_statement_as": name,
            "amount": amount
        }));
        Donate.update({'debit.id': debitID}, {$set: {'credit.id': credit.id,
        'credit.amount': credit.amount}});
        return credit;
    }
});