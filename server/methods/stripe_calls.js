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

        var stripeCustomer = new Future();
        var type;
        if(paymentDevice.slice(0,2) === 'to'){
            type = "card";
            Stripe.customers.create({
                card: paymentDevice,
                email: customerInfo.email_address,
                metadata: {
                    "city": customerInfo.city,
                    "state": customerInfo.region,
                    "address_line1": customerInfo.address_line1,
                    "address_line2": customerInfo.address_line2,
                    "country": customerInfo.country,
                    "postal_code": customerInfo.postal_code,
                    "phone": customerInfo.phone_number,
                    "business_name": customerInfo.org,
                    "email": customerInfo.email_address,
                    "fname": customerInfo.fname,
                    "lname": customerInfo.lname
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
                email: customerInfo.email_address,
                metadata: {
                    "city": customerInfo.city,
                    "state": customerInfo.region,
                    "address_line1": customerInfo.address_line1,
                    "address_line2": customerInfo.address_line2,
                    "postal_code": customerInfo.postal_code,
                    "country": customerInfo.country,
                    "phone": customerInfo.phone_number,
                    "business_name": customerInfo.org,
                    "email": customerInfo.email_address,
                    "fname": customerInfo.fname,
                    "lname": customerInfo.lname
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
        if(!stripeCustomer.object){
            throw new Meteor.Error(stripeCustomer.rawType, stripeCustomer.message);
        }
        stripeCustomer._id = stripeCustomer.id;

        Customers.insert(stripeCustomer);
        logger.info("Customer _id: " + stripeCustomer.id);
        return stripeCustomer;
    },
    create_invoice: function (total, donation_id, customer_id, payment_id) {
        logger.info("Inside create_invoice.");
        var invoice = new Future();

        Stripe.invoices.create({
            amount_due: total,
            currency: "usd",
            customer: customer_id,
            source: payment_id
        }, function(error, charge){
            if (error){
                invoice.return(error);
            } else {
                invoice.return(charge);
            }
        });
        invoice = invoice.wait();
        if(!invoice.object){
            throw new Meteor.Error(invoice.rawType, invoice.message);
        }

        invoice._id = invoice.id;

        // Then
        var paid_invoice = Stripe.invoices.pay(invoice.id);
        logger.info("Finished create_invoice.");

    },
    charge: function (total, donation_id, customer_id, payment_id) {
        logger.info("Inside charge.");

        var stripeCharge = new Future();

        Stripe.charges.create({
            amount: total,
            currency: "usd",
            customer: customer_id,
            source: payment_id
        }, function(error, charge){
            if (error){
                //console.dir(error);
                stripeCharge.return(error);
            } else {
                stripeCharge.return(charge);
            }
        });
        stripeCharge = stripeCharge.wait();
        if(!stripeCharge.object){
            throw new Meteor.Error(stripeCharge.rawType, stripeCharge.message);
        }
        stripeCharge._id = stripeCharge.id;

        // Add charge response from Stripe to the collection
        Charges.insert(stripeCharge);
        logger.info("Finished Stripe charge. Charges ID: " + stripeCharge._id);
        return stripeCharge;
    },
    charge_plan: function (total, donation_id, customer_id, payment_id, frequency, start_date) {
        logger.info("Inside charge_plan.");
        console.log(total);

        var plan;

        switch(frequency){
            case "monthly":
                plan = Meteor.settings.stripe.plan.monthly;
                break;
            case "weekly":
                plan = Meteor.settings.stripe.plan.weekly;
                break;
            case "daily":
                plan = Meteor.settings.stripe.plan.daily;
                break;
        }

        var attributes = {
            plan: plan,
            quantity: total
        };
        if(start_date = 'today'){
        } else {
            attributes.trial_end = start_date;
        }
        var stripeChargePlan = new Future();
        Stripe.customers.createSubscription(
            customer_id,
            attributes,
            function(error, charge){
            if (error){
                //console.dir(error);
                stripeChargePlan.return(error);
            } else {
                stripeChargePlan.return(charge);
            }
        });
        stripeChargePlan = stripeChargePlan.wait();
        if(!stripeChargePlan.object){
            throw new Meteor.Error(stripeChargePlan.rawType, stripeChargePlan.message);
        }
        stripeChargePlan._id = stripeChargePlan.id;
        console.dir(stripeChargePlan);
        // Add charge response from Stripe to the collection
        Subscriptions.insert(stripeChargePlan);

        if(start_date === 'today'){
            var stripeInvoiceList = new Future();
            // Query Stripe to get the first invoice from this new subscription
            Stripe.invoices.list(
                { customer: customer_id, limit: 1 },
                function(error, invoice) {
                    if(error){
                        stripeInvoiceList.return(error);
                    } else {
                        stripeInvoiceList.return(invoice);
                    }
                });

            stripeInvoiceList = stripeInvoiceList.wait();
            logger.info("Finished Stripe charge_plan. Subscription ID: " + stripeChargePlan.id + " Charge ID: " +
            stripeInvoiceList.data[0].charge);
            return stripeInvoiceList.data[0].charge;
        } else {
            //TODO: send scheduled email & log in audit_email
            return 'scheduled';
        }
    },
    audit_email: function (id, type, body_object, billy) {
        if(type === 'invoice.created'){
            Audit_trail.update({balanced_debit_id: id}, {
                    $set: {
                        'invoice.created.sent': true,
                        'invoice.created.time': new Date()
                    }},
                {
                    upsert: true
                }
            );
        } else if (type === 'charge.succeeded') {
            Audit_trail.update({balanced_debit_id: id}, {
                    $set: {
                        'succeeded.sent': true,
                        'succeeded.time': new Date()
                    }},
                {
                    upsert: true
                }
            );
        } else if (type === 'large_gift') {
            Audit_trail.update({balanced_debit_id: id}, {
                    $set: {
                        'large_gift.sent': true,
                        'large_gift.time': new Date()
                    }},
                {
                    upsert: true
                }
            );
        } else if (type === 'failed') {
            if(billy){
                // Show that a failed email was sent for this subscription if it used Billy
                Audit_trail.update({
                    balanced_debit_id: id
                }, {
                    $set: {
                        'failed.sent': true,
                        'failed.time': new Date(),
                        'failed.failure_reason': body_object.failure_reason,
                        'failed.failure_reason_code': body_object.failure_reason_code
                    }
                }, {
                    upsert: true
                });

            } else {
                // Show that a failed email was sent for this subscription
                Audit_trail.update({
                    balanced_debit_id: id
                }, {
                    $set: {
                        'failed.sent': true,
                        'failed.time': new Date(),
                        'failed.failure_reason': body_object.failure_reason,
                        'failed.failure_reason_code': body_object.failure_reason_code
                    }
                }, {
                    upsert: true
                });
            }
        }
    }
});