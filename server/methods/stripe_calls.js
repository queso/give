var Future = Npm.require('fibers/future');

_.extend(Utils, {
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
    },
    create_customer: function (paymentDevice, customerInfo) {
        logger.info("Inside create_customer.");
        console.log(paymentDevice);
        // Initialize Stripe with the secret key
        var Stripe = StripeAPI(Meteor.settings.stripe.secret);

        var stripeCustomer = new Future();
        var type;
        if(paymentDevice.slice(0,2) === 'to'){
            type = "card";
            Stripe.customers.create({
                card: paymentDevice,
                email: customerInfo.email,
                metadata: {
                    "city": customerInfo.city,
                    "state": customerInfo.region,
                    "address_line1": customerInfo.address_line1,
                    "address_line2": customerInfo.address_line2,
                    "postal_code": customerInfo.postal_code,
                    'phone': customerInfo.phone_number,
                    'business_name': customerInfo.org
                }
            }, function(error, customer){
                if (error){
                    //console.dir(error);
                    stripeCustomer.return(error);
                } else {
                    stripeCustomer.return(customer);
                }
            });
        }else if(paymentDevice.slice(0,2) === 'bt'){
        /**/
            console.log("Bank_account");
            type = "bank_account";
            Stripe.customers.create({
                bank_account: paymentDevice,
                email: customerInfo.email,
                metadata: {
                    "city": customerInfo.city,
                    "state": customerInfo.region,
                    "address_line1": customerInfo.address_line1,
                    "address_line2": customerInfo.address_line2,
                    "postal_code": customerInfo.postal_code,
                    'phone': customerInfo.phone_number,
                    'business_name': customerInfo.org
                }
            }, function(error, customer){
                if (error){
                    //console.dir(error);
                    stripeCustomer.return(error);
                } else {
                    stripeCustomer.return(customer);
                }
            });
        } else{
            throw new Meteor.Error('Token-match', "Sorry, that token doesn't match any know prefix.");
        }
        stripeCustomer = stripeCustomer.wait();
        /*insertThis._id = Customers.insert({_id: customerData.id});
        Customers.update({_id: customerData.id}, {$set: insertThis});
        logger.info("Customer _id: " + insertThis._id);*/

        return stripeCustomer;


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
    }
});