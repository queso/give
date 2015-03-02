Meteor.methods({
    update_customer: function (form, customer_id, dt_persona_id) {

        //Check the client side form fields with the Meteor 'check' method
        Utils.check_update_customer_form(form, customer_id, dt_persona_id);

        // Send the user's contact updates to balanced
        Utils.update_balanced_customer(form, customer_id);

        // Send the user's contact udpates to Donor Tools
        Utils.update_dt_account(form, dt_persona_id);
    }
});

_.extend(Utils, {
    update_balanced_customer: function(form, customer_id){
        logger.info("Inside update_balanced_customer.");
        console.log(customer_id);

        // Setup balanced key
        balanced.configure(Meteor.settings.balanced_api_key);


        var customerData = {};
        customerData = Utils.extractFromPromise(balanced.get('/customers/'+ customer_id).set('address',
                {
                    "city": form['address.city'],
                    "state": form['address.state'],
                    "line1": form['address.line1'],
                    "line2": form['address.line2'],
                    "postal_code": form['address.postal_code']
                })
                .set("phone", form.phone)
                .save()
        );
        console.dir(customerData);
    },
    update_dt_account: function(form, dt_persona_id){
        logger.info("Inside update_dt_account.");

        // get the persona record from Donor Tools
        var get_dt_persona = HTTP.get(Meteor.settings.donor_tools_site + '/people/' + dt_persona_id + '.json', {
            auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
        });
        var persona = get_dt_persona.data.persona;

        // Shape the data the way it needs to go into the persona record
        var street_address = form['address.line1'] + " \n" + form['address.line2'];
        persona.addresses[0] = {
            "city": form['address.city'],
            "state": form['address.state'],
            "street_address": street_address,
            "postal_code": form['address.postal_code']
        };
        persona.phone_numbers[0].phone_number = form.phone;
        console.dir(persona);

        delete persona.total_donations;
        delete persona.max_donation;
        delete persona.first_donation_amount;

        var update_persona = HTTP.call("PUT", Meteor.settings.donor_tools_site + '/people/'+ dt_persona_id + '.json',
            {
                data: {"persona": persona},
                auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
            });
        console.log("***********LOOK HERE************");
        console.dir(update_persona);
        //DT_donations.update(dt_donation, {$set: {'payment_status': debit_cursor.status}});

    },
    create_customer: function (customerInfo, billy) {
        logger.info("Inside create_customer.");
        var customerData = {};
        customerData= Utils.extractFromPromise(balanced.marketplace.customers.create({
            'name': customerInfo.fname + " " + customerInfo.lname,
            "address": {
                "city": customerInfo.city,
                "state": customerInfo.region,
                "line1": customerInfo.address_line1,
                "line2": customerInfo.address_line2,
                "postal_code": customerInfo.postal_code
            },
            'email': customerInfo.email_address,
            'phone': customerInfo.phone_number,
            'business_name': customerInfo.org
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
        insertThis._id = Customers.insert({_id: customerData.id});
        Customers.update({_id: customerData.id}, {$set: insertThis});
        logger.info("Customer _id: " + insertThis._id);
        return insertThis;
    },
    get_card: function (customer_id, cardHref) {
        logger.info("Inside get_card.");
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
        /*try {*/
        logger.info("Inside create_association function");
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
        /*} catch (e) {
         logger.info("Got to catch error area of create_associate. Donation_id: " + donation_id + " Category Code: " + e.category_code + ' Description: ' + e.description);
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
         }*/
    },
    get_debit: function (debitHref) {
        logger.info("Inside get_debit.");
        logger.info("Debit Href: " + debitHref);
        balanced.configure(Meteor.settings.balanced_api_key);

        //var debit = Utils.extractFromPromise(balanced.get(debitHref));
        var debit = Utils.extractFromPromise(balanced.get(debitHref));
        //logger.info(Object.getOwnPropertyNames(debit));
        logger.info(debit._api.cache[debit.href]);
        var insert_debit = debit._api.cache[debit.href];
        return insert_debit;
    },
    get_customer: function (customerHref) {
        logger.info("Inside get_customer.");
        logger.info("Customer Href: " + customerHref);
        balanced.configure(Meteor.settings.balanced_api_key);

        var customer = Utils.extractFromPromise(balanced.get(customerHref));
        logger.info(customer._api.cache[customer.href]);
        var customer_info = customer._api.cache[customer.href];
        return customer_info;
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
            case 'JamesHishmeh':
                returnToCalled = 'James Hishmeh';
                return returnToCalled;
                break;
            case 'WillieBrooks':
                returnToCalled = 'Willie Brooks';
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
            case 'ChrisMammoliti':
                returnToCalled = 'Chris Mammoliti';
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
