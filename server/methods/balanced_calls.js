_.extend(Utils,{
    get_card: function (id, cardHref) {
        console.log("Inside card create.");
        var card;
        card = Utils.extractFromPromise(balanced.get(cardHref));
        

        //Need to move this to the client side
        /*if (card.cvv_result === 'No Match'){
            console.log("No match in CVV area of card_create. ID: " + data._id);
                var failThis = Donate.update(data._id, {
                    $set: {
                        'failed.category_code': 'CVV_No_Match',
                        'failed.in': 'card_create',
                        'debit.status': 'failed',
                        'debit.submitted': false
                    }
                });
            throw new Meteor.Error('CVV', 'CVV', 'Your CVV code does not match your card number. Please check the code and try again.');
        }*/

        //add card create response from Balanced to the database
        var cardResponse = Donate.update(id, {
            $push: {
                'card': {
                    'fingerprint': card.fingerprint,
                    'id':               card.id,
                    'type':             card.type,
                    'href':             card.href,
                    'cvv_result':       card.cvv_result,
                    'number':           card.number,
                    'expiration_month': card.expiration_month,
                    'expiration_year':  card.expiration_year,
                    'bank_name':        card.bank_name,
                    'brand':            card.brand,
                    'created_at':       card.created_at,
                    'can_debit':        card.can_debit
                }
            }
        });

        //TODO: need to refactor this once we are taking multiple cards
        var cardMiscSet = Donate.update(id, {$set: {
            'debit.customer': card.links.customer
        }});
        return card;
    },
    check_create: function (id, checkHref) {
        var check;
        check = Utils.extractFromPromise(balanced.get(checkHref));
        Donate.update(id, {
            $push: {
                'bank_account': { 
                    'fingerprint':      check.fingerprint,               
                    'id':               check.id,
                    'type':             check.account_type,
                    'href':             check.href,
                    'account_number':   check.account_number,
                    'routing_number':   check.routing_number,
                    'bank_name':        check.bank_name,
                    'account_type':     check.account_type,
                    'name':             check.name,
                    'created_at':       check.created_at,
                    'can_debit':        check.can_debit,
                    'can_credit':       check.can_credit
                }
            }
        });

        //TODO: need to refactor this once we are taking multiple bank_accounts
        var cardMiscSet = Donate.update(id, {$set: {
            'debit.customer': check.links.customer
        }});
        return check;
    },
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
                console.log("Got to catch error area of create_associate. ID: " + data._id + " Category Code: " + e.category_code + ' Description: ' + e.description);
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
    },
    getDonateTo: function(donateTo) {
        var returnToCalled;
        switch(donateTo) {
            case 'JoshuaBechard':
                returnToCalled = 'Joshua Bechard';
                return returnToCalled;
                break;
            case 'WhereMostNeeded':
                returnToCalled = 'Where Most Needed';
                return returnToCalled;
                break;
            case 'TimmCollins':
                returnToCalled = 'Timm Collins';
                return returnToCalled;
                break;
            case 'JonDeMeo':
                returnToCalled = 'Jon DeMeo';
                return returnToCalled;
                break;
            case 'BrettDurbin':
                returnToCalled = 'Brett Durbin';
                return returnToCalled;
                break;
            case 'JohnKazaklis':
                returnToCalled = 'John Kazaklis';
                return returnToCalled;
                break;
            case 'ChirsMammoliti':
                returnToCalled = 'Chirs Mammoliti';
                return returnToCalled;
                break;
            case 'ShelleySetchell':
                returnToCalled = 'Shelley Setchell';
                return returnToCalled;
                break;
            case 'IsaacTarwater':
                returnToCalled = 'Isaac Tarwater';
                return returnToCalled;
                break;
            case 'UrgentOperationalNeeds':
                returnToCalled = 'Urgent Operational Needs';
                return returnToCalled;
                break;
            case 'DRUrgent':
                returnToCalled = 'DR Urgent';
                return returnToCalled;
                break;
            case 'DRCS':
                returnToCalled = 'DR Community Sponsorship';
                return returnToCalled;
                break;
            case 'DRInfrastructure':
                returnToCalled = 'DR Infrastructure';
                return returnToCalled;
                break;
            case 'HondurasUrgent':
                returnToCalled = 'Honduras Urgent';
                return returnToCalled;
                break;
            case 'HondurasCS':
                returnToCalled = 'Honduras Community Sponsorship';
                return returnToCalled;
                break;
            case 'HondurasInfrastructure':
                returnToCalled = 'Honduras Infrastructure';
                return returnToCalled;
                break;
            case 'PhilippinesUrgent':
                returnToCalled = 'Philippines Urgent';
                return returnToCalled;
                break;
            case 'PhilippinesCS':
                returnToCalled = 'Philippines Community Sponsorship';
                return returnToCalled;
                break;
            case 'PhilippinesInfrastructure':
                returnToCalled = 'Philippines Infrastructure';
                return returnToCalled;
                break;
            default:
                returnToCalled ='Where Most Needed';
                return returnToCalled;
        }
    }
});