_.extend(Utils,{
    card_create: function (data) {
        console.log("Inside card create.");
        var card;
        card = Utils.extractFromPromise(balanced.card.create({
            "name": data.customer.fname + " " + data.customer.lname,
            'number': data.paymentInformation.card_number,
            'expiration_year': data.paymentInformation.expiry_year,
            'expiration_month': data.paymentInformation.expiry_month,
            'cvv': data.paymentInformation.cvv,
            "appears_on_statement_as": "Trash Mountain"
        }));
        if (card.cvv_result === 'No Match'){
            logger.error("No match in CVV area of card_create. ID: " + data._id);
                var failThis = Donate.update(data._id, {
                    $set: {
                        'failed.category_code': 'CVV_No_Match',
                        'failed.in': 'card_create',
                        'debit.status': 'failed',
                        'debit.submitted': false
                    }
                });
            throw new Meteor.Error('CVV', 'CVV', 'Your CVV code does not match your card number. Please check the code and try again.');
        }

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
        return card;
    },
    check_create: function (data) {
        var check;
        check = Utils.extractFromPromise(balanced.bank_account.create({
            "name": data.customer.fname + " " + data.customer.lname,
            "routing_number": data.paymentInformation.routing_number,
            "account_type": data.paymentInformation.account_type,
            "account_number": data.paymentInformation.account_number,
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
    /*debit_create: function (data, checkHref) {
        var associate;
        var processor_uri = Donate.findOne(data._id).recurring.customer.processor_uri;
        logger.info(checkHref + ' ' + processor_uri);
        logger.info("Associate uri: " + processor_uri);
        associate = Utils.extractFromPromise(balanced.get(checkHref).associate_to_customer(processor_uri));
        logger.info("Associate and debit: ");
    },*/
    create_association: function (data, paymentHref, otherHref) {
            try {
                console.log("Inside create_association function");
                    associate = Utils.extractFromPromise(balanced.get(paymentHref).associate_to_customer(otherHref));
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
                        'failed.description': e.description,
                        'failed.in': 'create_association',
                        'failed.eventID': e.request_id,
                        'debit.status': 'failed'
                    }
                });
                throw new Meteor.Error(e.category_code, e.description);
            }
    },
    create_customer: function(customerInfo, id) {
        var customerData;
        customerData =  Utils.extractFromPromise(balanced.marketplace.customers.create({
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
        Donate.update({id: id}, {$set: {
            'customer.type': customerData._type,
             status: 'Customer created.',
            'customer.id': customerData.id
        }});
        return customerData;
    }
});