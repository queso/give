var Future = Meteor.npmRequire("fibers/future");
function extractFromPromise(promise) {
    var fut = new Future();
    promise.then(function (result) {
        fut.return(result);
    }, function (error) {
        logger.info(error);
        fut.throw(error);
    });
    return fut.wait();
}

Meteor.methods({
    card_create: function (data) {
        console.log("Inside card create: " + data);
        var card;
        card = extractFromPromise(balanced.card.create({
            "name": data.customer[0].fname + " " + data.customer[0].lname,
            'number': data.paymentInformation[0].card_number,
            'expiration_year': data.paymentInformation[0].expiry_year,
            'expiration_month': data.paymentInformation[0].expiry_month,
            'cvv': data.paymentInformation[0].cvv,
            "appears_on_statement_as": "Trash Mountain"
        }));
        console.log(card);
        return card;
    },
    check_create: function (data) {
        console.log("Inside check create: " + data.customer[0].fname);
        var check;
        check = extractFromPromise(balanced.bank_account.create({
            "name": data.customer[0].fname + " " + data.customer[0].lname,
            "routing_number": data.paymentInformation[0].routing_number,
            "account_type": data.paymentInformation[0].account_type,
            "account_number": data.paymentInformation[0].account_number,
            "appears_on_statement_as": "Trash Mountain"
        }));
        console.log(check);
        return check;
    },
    //Not in use
    verify_check: function (checkHref) {
      var verifiedCheck;
        verifiedCheck = extractFromPromise(balanced.get(checkHref).verify().confirm(1,1));
        return verifiedCheck;
    },
    debit_create: function (data, checkHref) {
        var associate;
        var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
        logger.info(checkHref + ' ' + processor_uri);
        logger.info("Associate uri: " + processor_uri);
        associate = extractFromPromise(balanced.get(checkHref).associate_to_customer(processor_uri));
        logger.info("Associate and debit: ");
        console.dir(JSON.stringify(associate));
    },
    create_association: function (data, checkHref, customerHref) {
            var associate;
       // var type = data.paymentInformation[0].type;
            associate = extractFromPromise(balanced.get(checkHref).associate_to_customer(customerHref).debit({
                "amount": data.paymentInformation[0].total_amount * 100,
                "appears_on_statement_as": "Trash Mountain"}));
            console.log("Associate and debit: ");
            console.dir(JSON.stringify(associate));
            return associate;
    }
});