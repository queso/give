Convert = {
    start_conversion: function(id, type, body, billy, transaction_guid, subscription_guid){
        console.log("Inside start_conversion.");
        //Tell the system to pause email sends for this id and this type of debit.
        Convert.pause_email(id, type);

        Convert.find_donate(subscription_guid, body.events[0].entity.debits[0].links.customer, id, transaction_guid);

        //Do these last
        Convert.unpasue_email(id); //TODO: Do I need the type here?
    },
    find_donate: function (subscription_guid, customer_id, debit_id, transaction_guid) {
        console.log("Inside find_donate.");
        var donateDoc = Donate.findOne({'subscriptions.guid': subscription_guid});

        Convert.insert_donation(donateDoc, customer_id, debit_id, transaction_guid);
        Convert.insert_customer(donateDoc, customer_id);
    },
    find_debits: function (donateDoc, donations_id) {
        console.log("Inside find_debits with donaations_id of " + donations_id);

        donateDoc.transactions.forEach(function (element) {
            console.log(element.processor_uri);
            Convert.insert_debit(donateDoc, donations_id, element.processor_uri, element.guid);
        });

    },
    insert_debit: function(donateDoc, donation_id, debit_href, transaction_guid){
        console.log("Inside insert_debit with transaction_guid of " + transaction_guid);
        //add the donation_id and the transaction_guid to each of the Debit objects before inserting into the collection
        var debit = Utils.get_debit(debit_href);
        debit.donation_id = donation_id;
        debit.transaction_guid = transaction_guid;
        Debits.insert({'debit.id': _id}, debit);
    },
    insert_customer: function (donateDoc, customer_id) {
        console.log("Inside insert_customer.");
        // get the customer object from balanced
        var customer = Utils.get_customer('/customers/' + customer_id);


        if (donateDoc.billy_customer) {
            customer.billy = donateDoc.billy_customer
        }
        else{}
        if (donateDoc.cards) {
            customer.cards = donateDoc.cards
        }
        else if(donateDoc.bank_account){
            customer.bank_accounts = donateDoc.bank_account
        }

        // insert this customer into the customer's collection with the same id that balanced uses
        Customers.insert({_id: customer_id}, customer);

    },
    insert_donation: function (donateDoc, customer_id, debit_id, transaction_guid) {
        console.log("Inside insert_donation.");
        //copy and delete the object properties needed to fit the change from the donate to the donations collection
        delete donateDoc.card;
        delete donateDoc.bank_account;
        delete donateDoc.billy_customer;
        delete donateDoc.viewable;
        delete donateDoc.is_recurring;
        delete donateDoc.customer;
        donateDoc.customer_id = customer_id;

        donateDoc.amount = donateDoc.debit.amount;
        donateDoc.coverdTheFees = donateDoc.debit.coverdTheFees;
        donateDoc.donateTo = donateDoc.debit.donateTo;
        donateDoc.donateWith = donateDoc.debit.donateWith;
        donateDoc.fees = donateDoc.debit.fees;
        donateDoc.status = donateDoc.debit.status;
        donateDoc.total_amount = donateDoc.debit.total_amount;
        donateDoc.type = donateDoc.debit.type;
        delete donateDoc.debit;

        //insert the donation into the collection
        var donations_id = Donations.insert(donateDoc);
        Convert.insert_debit(donateDoc, donations_id, '/debits/' + debit_id, transaction_guid);
        Convert.find_debits(donateDoc, donations_id);
    },
    pause_email: function(id, type){
        console.log("Inside pause_email.");
    },
    unpasue_email: function(id){
        console.log("Inside unpasue_email.");
    }
};
