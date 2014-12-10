_.extend(Utils, {
    create_customer: function (customerInfo, billy) {
        console.log("Inside create_customer.");
        var customerData = {};
        customerData= Utils.extractFromPromise(balanced.marketplace.customers.create({
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
        var insertThis = {};
        insertThis = customerData._api.cache[customerData.href];

        if(billy) {
            var billyCustomer = {};
            billyCustomer = Billy.createBillyCustomer(customerData.id);

            insertThis.billy = {
                'created_at': billyCustomer.created_at,
                'customer_guid': billyCustomer.guid,
                'deleted': billyCustomer.deleted,
                'company_guid': billyCustomer.company_guid,
                'processor_uri': billyCustomer.processor_uri,
                'updated_at': billyCustomer.updated_at
            };
        }
        insertThis._id = Customers.insert(insertThis);
        logger.info("Customer _id: " + insertThis._id);
        return insertThis;
    },
    get_card: function (customer_id, cardHref) {
        console.log("Inside get_card.");
        var card;
        card = Utils.extractFromPromise(balanced.get(cardHref));

        var insert_card = card._api.cache[card.href];
        return card;
    },
    get_check: function (customer_id, checkHref) {
        logger.info("Inside get_check.");
        var check;
        check = Utils.extractFromPromise(balanced.get(checkHref));

        var insert_check = check._api.cache[check.href];
        return check;
    },
    create_association: function (customer_id, paymentHref, customerHref) {
        try {
            console.log("Inside create_association function");
            associate = Utils.extractFromPromise(balanced.get(paymentHref).associate_to_customer(customerHref));
            //add debit response from Balanced to the database
            var insert_this = associate._api.cache[associate.href];
            //add card create response from Balanced to the collection
            if(associate._type === 'bank_account'){
                Customers.update(customer_id, {
                    $push: {
                        bank_accounts: insert_this
                    }
                });
            } else {
                Customers.update(customer_id, {
                    $push: {
                        cards: insert_this
                    }
                });
             }

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