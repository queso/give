_.extend(Utils, {
    create_customer: function (customerInfo, billy) {
        console.log("Inside create_customer.");
        var customerData = Utils.extractFromPromise(balanced.marketplace.customers.create({
            'name': customerInfo.fname + " " + customerInfo.lname,
            "address": {
                "city": customerInfo.city,
                "state": customerInfo.region,
                "line1": customerInfo.address_line1,
                "line2": customerInfo.address_line2,
                "postal_code": customerInfo.postal_code,
            },
            'email': customerInfo.email_address,
            'phone': customerInfo.phone_number
        }));

        if(billy) {
            var billyCustomer = {};
            billyCustomer = Billy.createBillyCustomer(customerData.id);

            var insertThis = {};
            insertThis = customerInfo;
            insertThis.billy = {
                'created_at': billyCustomer.created_at,
                'customer_guid': billyCustomer.guid,
                'deleted': billyCustomer.deleted,
                'company_guid': billyCustomer.company_guid,
                'processor_uri': billyCustomer.processor_uri,
                'updated_at': billyCustomer.updated_at
            };
            insertThis._id = Customers.insert(insertThis);
            return insertThis;
        } else {
            //add customer create response from Balanced to the collection
            customerData._id = Customers.insert(customerData);
            console.dir("customer ID: " + customerData.id);
            console.dir(customerData);

            return customerData;
        }
    },
    get_card: function (customer_id, cardHref) {
        console.log("Inside get_card.");
        var card;
        card = Utils.extractFromPromise(balanced.get(cardHref));

        var insert_card = {};
        insert_card = {
            'fingerprint': card.fingerprint,
            'id': card.id,
            'type': card.type,
            'href': card.href,
            'cvv_result': card.cvv_result,
            'number': card.number,
            'expiration_month': card.expiration_month,
            'expiration_year': card.expiration_year,
            'expires': new Date(card.expiration_year + '-' + card.expiration_month),
            'bank_name': card.bank_name,
            'brand': card.brand,
            'created_at': card.created_at,
            'can_debit': card.can_debit,
            'customer_id': card.links.customer
        };
        //add card create response from Balanced to the collection
        Customers.update(customer_id, {
            $push: {
                card: insert_card
            }
        });
        return card;
    },
    get_check: function (customer_id, checkHref) {
        logger.info("Inside get_check.");
        var check;
        check = Utils.extractFromPromise(balanced.get(checkHref));

        var insert_check = {};
        insert_check = {
            'fingerprint': check.fingerprint,
            'id': check.id,
            'type': check.account_type,
            'href': check.href,
            'account_number': check.account_number,
            'routing_number': check.routing_number,
            'bank_name': check.bank_name,
            'account_type': check.account_type,
            'name': check.name,
            'created_at': check.created_at,
            'can_debit': check.can_debit,
            'can_credit': check.can_credit,
            'customer_id': check.links.customer
        };

        //add check create response from Balanced to the collection
        Customers.update(customer_id, {
            $push: {
                check: insert_check
            }
        });
        return check;
    },
    create_association: function (donation_id, paymentHref, customerHref) {
        try {
            console.log("Inside create_association function");
            associate = Utils.extractFromPromise(balanced.get(paymentHref).associate_to_customer(customerHref));
            //add debit response from Balanced to the database
            Donations.update(donation_id, {
                $set: {
                    'type': associate.type
                }
            });
            return associate;
        } catch (e) {
            console.log("Got to catch error area of create_associate. Donation_id: " + donation_id + " Category Code: " + e.category_code + ' Description: ' + e.description);
            Donations.update(donation_id, {
                $set: {
                    'failed.category_code': e.category_code,
                    'failed.description': e.description,
                    'failed.in': 'create_association',
                    'failed.eventID': e.request_id,
                    'status': 'failed'
                }
            });
            throw new Meteor.Error(e.category_code, e.description);
        }
    },

    getDonateTo: function (donateTo) {
        var returnToCalled;
        switch (donateTo) {
            case 'WriteIn':
                return 'Write In';
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
                returnToCalled = 'Santiago, DR - Community Sponsorship';
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
                returnToCalled = 'Tanza, Philippines - Community Sponsorship';
                return returnToCalled;
                break;
            case 'PhilippinesInfrastructure':
                returnToCalled = 'Philippines Infrastructure';
                return returnToCalled;
                break;
            default:
                returnToCalled = 'Where Most Needed';
                return returnToCalled;
        }
    }
});