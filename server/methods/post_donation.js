_.extend(Utils, {
    post_donation_operation: function (customer_id, donation_id, debit_id) {
        // If this is the dev environment I don't want it to affect DT live account.
        /*if(Meteor.settings.dev){
            return;
        }*/
        logger.info("Started post_donation_operation.");

        if(DT_donations.findOne({transaction_id: debit_id})){
            logger.info("There is already a DT donation with that debit_id in the collection");
            return;
        } else {
            // TODO: Check the connection to DT before starting, if it isn't good then schedule this to happen in an hour Meteor.setTimeout({ function here }, 3600000);
            // Don't see how to do this yet

            // create an email_address variable to be reused below
            var email_address = Customers.findOne(customer_id).email;
            //create user
            var user_id = Utils.create_user(email_address, customer_id);

            //check dt for user, persona_ids will be an array of 0 to many persona_ids
            var persona_ids = Utils.check_for_dt_user(email_address);

            //create dt user since one wasn't found in DT
            if (persona_ids == '') {
                //Call DT create function
                var single_persona_id = Utils.insert_donation_and_donor_into_dt(customer_id, donation_id, user_id, debit_id);

                // the persona_ids is expected to be an array
                persona_ids = [single_persona_id];

                // Send me an email letting me know a new user was created in DT.
                Utils.send_dt_new_dt_account_added(email_address, user_id, single_persona_id);
            } else {
                Utils.insert_donation_into_dt(customer_id, donation_id, user_id, persona_ids, debit_id);
            }
        }

        // Get all of the donations related to the persona_id that was either just created or that was just used when
        // the user gave
        Utils.get_all_dt_donations(persona_ids);

        // forEach of the persona ids stored in the array run the insert_persona_id_into_user function
        persona_ids.forEach(function(element){
            Utils.insert_persona_id_into_user(user_id, element);
        });

        Utils.link_gift_to_user(customer_id, donation_id, debit_id, user_id);

    },
    create_user: function (email, customer_id) {
        logger.info("Started create_user.");

        // setup name variable
        var customer_cursor = Customers.findOne(customer_id);

        var name = customer_cursor && customer_cursor.name;

        //Check to see if the user exists
        var user_id = Meteor.users.findOne({'emails.address': email});

        if(!user_id){
            // No user found with that email address
            // Create a new user
            user_id = Accounts.createUser({email: email});

            // Add some details to the new user account
            Meteor.users.update(user_id, {$set: {'profile.name': name, 'primary_customer_id': customer_id}});

            // Send an enrollment Email to the new user
            Accounts.sendEnrollmentEmail(user_id);
        } else {
            logger.info("Found a user with the provided email address, didn't create a user.")
        }
        return user_id;
    },
    check_for_dt_user: function(email){
        /*try {*/
        //This function is used to get all of the persona_id s from DT if they exist or return false if none do
        logger.info("Started check_for_dt_user");

        var personResult;
        personResult = HTTP.get(Meteor.settings.donor_tools_site + "/people.json?search=" + email, {
            auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
        });

        if(personResult.data == ''){
            return [];
        } else {
            var personaIDs = [];
            personResult.data.forEach(function (element) {
                personaIDs.push(element.persona.id)
            });
            return personaIDs;
        }

        /*} catch (e) {
         console.log(e);
         //e._id = AllErrors.insert(e.response);
         var error = (e.response);
         throw new Meteor.Error(error, e._id);
         }*/
    },
    link_gift_to_user: function(customer_id, donation_id, debit_id, userId) {
        logger.info("Started link_gift_to_user.");
        try {
            var insertThis = {};
            insertThis.customers = customer_id;
            insertThis.donations = donation_id;
            insertThis.debits = debit_id;

            Meteor.users.update(userId, {$addToSet: insertThis});
        } catch (e) {
            logger.error(e);
        }
    },
    insert_donation_and_donor_into_dt: function (customer_id, donation_id, user_id, debit_id){
        /*try {*/
        logger.info("Started insert_donation_and_donor_into_dt");

        var donation = Donations.findOne(donation_id);
        var customer = Customers.findOne(customer_id);

        var source_id, business_name, payment_status, received_on;

        if (customer && customer.business_name){
            business_name = customer.business_name;
            source_id = 42776;
        }else{
            business_name = '';
            source_id = 42754;
        }

        var recognition_name;
        if(business_name){
            recognition_name = business_name;
        } else {
            recognition_name = customer.name;
        }

        if(debit_id.substring(0, 1) == 'SU'){
            payment_status = 'Scheduled'
            received_on = donation.start_date;
        } else {
            received_on = moment(new Date(donation.created_at)).format("YYYY/MM/DD");
            payment_status = "pending";
        }


        var newDonationResult;
        newDonationResult = HTTP.post(Meteor.settings.donor_tools_site + '/donations.json', {
            data: {
                "donation": {
                    "splits": [{
                        "amount_in_cents": donation.amount,
                        "fund_id": DT_funds.findOne({name: donation.donateTo})._id,
                        "memo": Meteor.settings.dev
                    }],
                    "donation_type_id": 2985,
                    "received_on": received_on,
                    "source_id": source_id,
                    "payment_status": payment_status,
                    "transaction_id": debit_id,
                    "find_or_create_person": {
                        "company_name": business_name,
                        "full_name": customer.name,
                        "email_address": customer.email,
                        "street_address": customer.address.line1 + " \n" + customer.address.line2,
                        "city": customer.address.city,
                        "state": customer.address.state,
                        "postal_code": customer.address.postal_code,
                        "phone_number": customer.phone,
                        "web_address": "https://trashmountain.com/give/dashboard/users?userID=" + user_id,
                        "salutation_formal": customer.name,
                        "recognition_name": recognition_name
                    }
                }
            },
            auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
        });

        if(newDonationResult && newDonationResult.data && newDonationResult.data.donation && newDonationResult.data.donation.persona_id){
            return newDonationResult.data.donation.persona_id;
        } else {
            logger.error("The persona ID wasn't returned from DT, or something else happened with the connection to DT.");
            throw new Meteor.Error("Couldn't get the persona_id for some reason");
        }

        /*}
         catch (e) {
         console.log(e);
         //e._id = AllErrors.insert(e.response);
         var error = (e.response);
         throw new Meteor.Error(error, e._id);
         }*/
    },
    separate_donations: function(serverResponse){
        logger.info("Inside separate_donations");

        //Pull each donation from the array and send them to be inserted
        serverResponse.forEach(function (element) {
            Utils.insert_each_dt_donation(element.donation);
        });
    },
    insert_each_dt_donation: function(donation){
        //logger.info("Inside insert_each_dt_donation with " + donation.id);

        //Insert each donation into the DT_donations collection
        donation._id = donation.id;
        //logger.info(donation._id);
        DT_donations.upsert({_id: donation._id}, donation);
    },
    separate_funds: function(fundResults){
        logger.info("Inside separate_funds");

        //Pull each donation from the array and send them to be inserted
        fundResults.forEach(function (element) {
            Utils.insert_each_dt_fund(element.fund);
        });
    },
    insert_each_dt_fund: function(fund){
        logger.info("Inside insert_each_dt_fund with " + fund.id);

        //Insert each donation into the DT_funds collection
        fund._id = fund.id;
        DT_funds.upsert({_id: fund._id}, fund);
    },
    get_all_dt_donations: function(persona_ids) {
        try {
            logger.info("Started get_all_dt_donations");

            if(persona_ids == '') {return;}
            persona_ids.forEach(function(id){
                var responseData;
                responseData = HTTP.get(Meteor.settings.donor_tools_site + "/people/" + id + '/donations.json?per_page=1000', {
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });

                //Call the function to separate the donation array received from DT into individual donation
                Utils.separate_donations(responseData.data);
            });

        } catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
    },
    send_dt_search_email: function (email, name, id, personaIDs, donation_id){
        //This email allows the recipient to quickly check DT for the user by searching for their email
        //If there were any persona_ids from DT then this email will include one link to each of the persona_ids
        //that matched the email address provided.
        //Clicking the link will take the admin user to the DonorTools page where they can confirm
        //that they would like to connect the meteor user with that DT persona_id by submitting the
        //DT Persona Insert form

        logger.info("Started send_dt_search_email");
        var html;
        if(personaIDs != ''){
            html = "<h1>DT account not found</h1><p><a href='https://trashmountain.donortools.com/personas?search=" + name + "&go=true'>Search DT for this person</a></p>";
            personaIDs.forEach(function (persona_id) {
                html += "<p><a href='https://trashmountain.com/give/donorTools?id=" + id + "&persona_id=" + persona_id + "&email=" + email + "&donation_id=" + donation_id + "'>Insert after finding or creating in DT</a></p>";
            });
        } else
            html = "<h1>DT account not found</h1><p><a href='https://trashmountain.donortools.com/personas?search=" + name + "&go=true'>Search DT for this person</a></p>" +
            "<p><a href='https://trashmountain.com/give/donorTools?id=" + id + "&persona_id=&email=" + email + "&donation_id=" + donation_id + "'>Insert after finding or creating in DT</a></p>";

        //Send email to reconcile DT personas

        Email.send({
            from: 'support@trashmountain.com',
            to: 'josh@trashmountain.com',
            subject: "DT account not found.",
            html: html
        });
    },
    insert_persona_id_into_user: function(id, persona_id) {
        //Insert the donor tools persona id into the user record
        logger.info("Started insert_persona_id_into_user");
        Meteor.users.update(id, {$addToSet: {'persona_id': parseInt(persona_id)}});
    },
    insert_donation_into_dt: function (customer_id, donation_id, user_id, persona_ids, debit_id){
        /*try {*/
        logger.info("Started insert_donation_into_dt");

        //TODO: still need to fix the below for any time when the debit isn't being passed here, like for scheduled gifts
        if(Audit_trail.findOne({debit_id: debit_id}) && Audit_trail.findOne({debit_id: debit_id}).dt_donation_created){
            logger.info("Already inserted the donation into DT.");
            return;
        } else {
            Audit_trail.upsert({_id: debit_id}, {$set: {dt_donation_created: true}});
        }


        var donation = Donations.findOne(donation_id);
        var customer = Customers.findOne(customer_id);
        var dt_fund = DT_funds.findOne({name: donation.donateTo});

        //fund_id 65663 is the No-Match-Found fund used to help reconcile
        // write-in gifts and those not matching a fund in DT
        var fund_id = dt_fund && dt_fund._id || 65663;

        var source_id;

        if (customer && customer.business_name){
            source_id = 42776;
        }else{
            source_id = 42754;
        }
        logger.info("FIRST PERSONA ID ** " + persona_ids && persona_ids[0]);
        var persona_id = persona_ids && persona_ids[0];

        var newDonationResult;
        newDonationResult = HTTP.post(Meteor.settings.donor_tools_site + '/donations.json', {
            data: {
                "donation": {
                    "persona_id": persona_id,
                    "splits": [{
                        "amount_in_cents": donation.amount,
                        "fund_id": fund_id,
                        "memo": Meteor.settings.dev
                    }],
                    "donation_type_id": 2985,
                    "received_on": moment(new Date(donation.created_at)).format("YYYY/MM/DD"),
                    "source_id": source_id,
                    "payment_status": "pending",
                    "transaction_id": debit_id
                }
            },
            auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
        });

        if(newDonationResult && newDonationResult.data && newDonationResult.data.donation && newDonationResult.data.donation.persona_id){
            // Send the id of this new DT donation to the function which will update the debit to add that meta text.
            Utils.update_debit_with_dt_donation_id(debit_id, newDonationResult.data.donation.id);

            return newDonationResult.data.donation.persona_id;
        } else {
            logger.error("The persona ID wasn't returned from DT, or something else happened with the connection to DT.");
            throw new Meteor.Error("Couldn't get the persona_id for some reason");
        }

        /*}
         catch (e) {
         console.log(e);
         //e._id = AllErrors.insert(e.response);
         var error = (e.response);
         throw new Meteor.Error(error, e._id);
         }*/
    },
    send_dt_new_dt_account_added: function (email, id, personaID){

        logger.info("Started send_dt_new_persona_added_to_meteor_user");

        //Create the HTML content for the email.
        //Create the link to go to the new person that was just created.
        var html = "<h1>DT account created</h1><p>" +
            "Details: <br>Email: " + email + "<br>ID: " + id + "<br>Link: <a href='https://trashmountain.donortools.com/people/" + personaID +"'>" + personaID + "</a></p>";

        //Send email

        Email.send({
            from: 'support@trashmountain.com',
            to: 'josh@trashmountain.com',
            subject: "DT Account inserted.",
            html: html
        });
    },
    update_debit_with_dt_donation_id: function(debit_id, dt_donation_id){
        logger.info("Started update_debit_with_dt_donation_id");

        // Setup balanced key
        balanced.configure(Meteor.settings.balanced_api_key);

        // save the donor tools donation id to the meta text of the debit which was just created
        var debit = Utils.extractFromPromise(balanced.get('/debits/' + debit_id).set('meta', {'dt_donation_id': dt_donation_id}).save());
        ///Utils.extractFromPromise(debit.set('meta', {dt_donation_id: dt_donation_id}).save());
    },
    update_dt_status: function (debit_id, interval) {
        logger.info("Started update_dt_status");
        console.log(interval);
        console.log(debit_id);

        // Check to see if the donor tools donation has been inserted yet. Return if it hasn't
        Meteor.setTimeout(function(){
            var dt_donation = DT_donations.findOne({transaction_id: debit_id});

            if(dt_donation){
                console.log(dt_donation.id);
                var debit_cursor = Debits.findOne(debit_id);
                var get_dt_donation = HTTP.get(Meteor.settings.donor_tools_site + '/donations/' + dt_donation.id + '.json', {
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });
                console.dir(get_dt_donation.data.donation);
                var temp_value = {};
                temp_value.transaction_fee = (get_dt_donation.data.donation.transaction_fee /100)
                get_dt_donation.data.donation.payment_status = debit_cursor.status;

                var update_donation = HTTP.call("PUT", Meteor.settings.donor_tools_site + '/donations/'+ dt_donation.id + '.json',
                    {
                        data: {"donation": get_dt_donation.data.donation},
                        auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                    },
                    function (error, result) {
                        if (!error) {
                            return result;
                        } else {
                            if(!interval || interval < 10){
                                console.log(error + '\nFailed...retrying');
                                Meteor.setTimeout(function(){
                                    console.log(interval);
                                    Utils.update_dt_status(debit_id, interval+=1);
                                },60000);
                            } else{
                                logger.warn("Retried for 10 minutes, still could not connect.");
                            }
                        }
                    });

                DT_donations.update(dt_donation, {$set: {'payments_status': 'succeeded'}});



            } else {
                // There may not actually be a problem here, just want a warning in case there is.
                logger.warn("There is no DT_donation found, can't update its status");
                return;
            }
        }, 20000);
    },
    audit_dt_donation: function (debit_id, customer_id, donation_id){
        logger.info("Started audit_dt_donation");

        var audit_cursor = Audit_trail.findOne({debit_id: debit_id});
        if(audit_cursor && audit_cursor.dt_donation_created){
            // TODO: go to a function that just updates the DT Donation status, send that update to DT
            Utils.update_dt_status(debit_id);
        } else {
            Audit_trail.upsert({_id: debit_id}, {$set: {dt_donation_created: true}});
            Utils.post_donation_operation(customer_id, donation_id, debit_id);
        }
    }
});