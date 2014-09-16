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

function failTheRecord(errorWithID) {
    logger.error("Error from inside balanced_calls.js and failTheRecord: Category Code: " + errorWithID.e.category_code);

    // Update this record to reflect failed status.
    var id = errorWithID.id;
    var errors = errorWithID.e;
    Donate.update(id, {
        $set: {
            failed: errors
        }
    });
    throw new Meteor.Error(500, errorWithID.e);
}
_.extend(Utils,{
    card_create: function (data) {
        console.log("Inside card create.");
        var card;
        card = extractFromPromise(balanced.card.create({
            "name": data.customer[0].fname + " " + data.customer[0].lname,
            'number': data.paymentInformation[0].card_number,
            'expiration_year': data.paymentInformation[0].expiry_year,
            'expiration_month': data.paymentInformation[0].expiry_month,
            'cvv': data.paymentInformation[0].cvv,
            "appears_on_statement_as": "Trash Mountain"
        }));

        //add card create response from Balanced to the database
        var cardResponse = Donate.update(data._id, {$set: {
            'card.fingerprint': card.fingerprint,
            'card.id': card.id,
            'card.type': card.type,
            'card.cvv_result': card.cvv_result,
            'card.number': card.number,
            'card.expiration_month': card.expiration_month,
            'card.expiration_year': card.expiration_year,
            'card.href': card.href,
            'card.bank_name': card.bank_name,
            'card.created_at': card.created_at,
            'card.can_debit': card.can_debit,
            'debit.customer': card.links.customer
        }});
        console.log("Finished balanced card create");
        return card;
    },
    check_create: function (data) {
        var check;
        check = extractFromPromise(balanced.bank_account.create({
            "name": data.customer[0].fname + " " + data.customer[0].lname,
            "routing_number": data.paymentInformation[0].routing_number,
            "account_type": data.paymentInformation[0].account_type,
            "account_number": data.paymentInformation[0].account_number,
            "appears_on_statement_as": "Trash Mountain"
        }));
        console.dir(JSON.stringify(check));
        Donate.update(data._id, {
            $set: {
                'bank_account.id': check.id,
                'bank_account.type': check.account_type,
                'bank_account.href': check.href}
        });
        return check;
    },
    debit_create: function (data, checkHref) {
        var associate;
        var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
        logger.info(checkHref + ' ' + processor_uri);
        logger.info("Associate uri: " + processor_uri);
        associate = extractFromPromise(balanced.get(checkHref).associate_to_customer(processor_uri));
        logger.info("Associate and debit: ");
    },
    create_association: function (data, paymentHref, otherHref) {
            try {
                console.log("Inside create_association function");
                    associate = extractFromPromise(balanced.get(paymentHref).associate_to_customer(otherHref));
                    //add debit response from Balanced to the database
                    Donate.update(data._id, {
                        $set: {
                            'debit.type': associate.type
                        }
                    });
                    return associate;
            } catch(e) {
                logger.error("Got to catch error area of create_associate. ID: " + data._id + " Category Code: " + e.category_code + ' Description: ' + e.description);
                Donate.update(data._id, {
                    $set: {
                        'failed.category_code': e.category_code,
                        'failed.description': e.description
                    }
                });
                throw new Meteor.Error(e.category_code, e.description);
                /*var errorWithID = {};
                errorWithID.e = e;
                errorWithID.id = data._id;
                failTheRecord(errorWithID);*/
            }
    },
    create_customer: function(customerInfo, id) {
        var customerData;
        customerData =  extractFromPromise(balanced.marketplace.customers.create({
            'name': customerInfo.fname + " " + customerInfo.lname,
            "address": {
                "city": customerInfo.city,
                "state": customerInfo.region,
                "line1": customerInfo.address_line1,
                "line2": customerInfo.address_line2,
                "postal_code": customerInfo.postal_code,
            },
            'email': customerInfo.email_address,
            //need to add if statement for any fields that might be blank
            'phone': customerInfo.phone_number
        }));
        //add customer create response from Balanced to the database
        Donate.update(id, {$set: {
            'customer.type': customerData._type,
             status: 'Customer created.',
            'customer.id': customerData.id
        }});
        return customerData;
    }
});