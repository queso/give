Convert = {
    start_conversion: function(id, type, body, billy, transaction_guid, subscription_guid){
        logger.info("Inside start_conversion.");
        Convert.find_donate(subscription_guid, body.events[0].entity.debits[0].links.customer, id, transaction_guid);
    },
    find_donate: function (subscription_guid, customer_id, debit_id, transaction_guid) {
        logger.info("Inside find_donate.");
        var payment, type;
        if(Donate.findOne({'subscriptions.guid': subscription_guid})){
            var donateDoc = Donate.findOne({'subscriptions.guid': subscription_guid});
        }else{
            logger.error("Didn't find this subscription in the old collection, exiting.");
            return;
        }

        if(donateDoc.card){
            payment = donateDoc.card;
            type = 'card';
        }else{
            payment = donateDoc.bank_account;
            type = 'bank_account';
        }

        // Need to insert the customer first because the insert_donation function depends on the customer document
        Convert.insert_customer(donateDoc, payment, type, customer_id);
        Convert.insert_donation(donateDoc, customer_id, debit_id, transaction_guid);

    },
    find_debits: function (donateDoc, donations_id, debit_id, transaction_guid) {
        logger.info("Inside find_debits with donations_id of " + donations_id);

        // First check to see if this are any transactions
        // if no transactions exist then this debit was from a scheduled gift
        if(donateDoc && donateDoc.transactions && donateDoc.transactions.constructor === Array){
            donateDoc.transactions.forEach(function (element) {
                logger.info(element.processor_uri);
                Convert.insert_debit(donateDoc, donations_id, element.processor_uri, element.guid);
            });
        } else if (donateDoc){
            logger.info("Looks like this is a debit from a scheduled gift and there are no transactions to process.");
            Convert.insert_debit(donateDoc, donations_id, '/debits/' + debit_id, transaction_guid);
        }

    },
    insert_debit: function(donateDoc, donation_id, debit_href, transaction_guid){
        logger.info("Inside insert_debit with transaction_guid of " + transaction_guid);
        //add the donation_id and the transaction_guid to each of the Debit objects before inserting into the collection
        var debit = Utils.get_debit(debit_href);
        console.dir(debit);
        debit.donation_id = donation_id;
        debit.transaction_guid = transaction_guid;
        debit._id = debit.id;
        delete debit.meta['billy.transaction_guid'];
        logger.info(debit.id);

        // double check that the debit you are inserting isn't already stored in Debits. if it is just return to the calling function, else insert it.
        if(Debits.findOne({_id: debit.id})){
            logger.info("Found that Debit, exiting insert");
            return;
        }else {
            logger.info("Didn't find that Debit, inserting");
            Debits.insert(debit);

            // Link the gift to this user and process the post donation operations
            Utils.post_donation_operation(debit.links.customer, donation_id, debit._id);
        }
    },
    insert_customer: function (donateDoc, payment, type, customer_id) {
        logger.info("Inside insert_customer.");
        // get the customer object from balanced
        var customer = Utils.get_customer('/customers/' + customer_id);
        customer._id = customer.id;

        if (donateDoc.billy_customer) {
            customer.billy = donateDoc.billy_customer
        }

        if (type === 'card') {
            customer.cards = payment;

            // insert this customer into the customer's collection with the same id that balanced uses
            Customers.insert(customer);
        }
        else if(type === 'bank_account'){
            customer.bank_accounts = payment;

            // insert this customer into the customer's collection with the same id that balanced uses
            Customers.insert(customer);
        }


    },
    insert_donation: function (donateDoc, customer_id, debit_id, transaction_guid) {
        logger.info("Inside insert_donation.");
        //copy and delete the object properties needed to fit the change from the donate to the donations collection

        var copied_doc = donateDoc;
        delete copied_doc.card;
        delete copied_doc.bank_account;
        delete copied_doc.billy_customer;
        delete copied_doc.viewable;
        delete copied_doc.is_recurring;
        delete copied_doc.customer;
        copied_doc.customer_id = customer_id;

        copied_doc.amount = donateDoc.debit.amount;
        copied_doc.coverdTheFees = donateDoc.debit.coverdTheFees;
        copied_doc.donateTo = donateDoc.debit.donateTo;
        copied_doc.donateWith = donateDoc.debit.donateWith;
        copied_doc.fees = donateDoc.debit.fees;
        copied_doc.status = donateDoc.debit.status;
        copied_doc.total_amount = donateDoc.debit.total_amount;
        copied_doc.type = donateDoc.debit.type;
        delete copied_doc.debit;

        //insert the donation into the collection
        var donations_id = Donations.insert(copied_doc);
        Convert.insert_debit(copied_doc, donations_id, '/debits/' + debit_id, transaction_guid);
        Convert.find_debits(copied_doc, donations_id, debit_id, transaction_guid);
    }
};
