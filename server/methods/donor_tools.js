Meteor.methods({
    get_dt: function (id, url_part) {
        try {
            //check to see that the user is the admin user
            if(this.userId === Meteor.settings.admin_user){
                check(id, String);
                check(url_part, String);
                logger.info("Started get_donor");
                var donorResult;
                donorResult = HTTP.get(Meteor.settings.donor_tools_site + "/people/" + id + url_part + '?per_page=1000', {
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });

                if(url_part === '/donations.json'){
                    /*var insertThis = [];
                    _.each(donorResult.data, function(value) {
                        insertThis.push(value.donation)
                    });*/
                    Utils.separate_donations(donorResult.data);
                    return donorResult;
                }
            }else{
                console.log("You aren't an admin, you can't do that");
                check(id, String);
                check(url_part, String);
                return '';
            }

        } catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
    },
    get_dt_id: function (email){
        try {
            //check to see that the user is the admin user
            if(this.userId === Meteor.settings.admin_user) {
                check(email, String);
                logger.info("Started get_dt_id Meteor Method");
                var personResult;
                personResult = HTTP.get(Meteor.settings.donor_tools_site + "/people.json?search=" + email, {
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });

                console.dir(personResult.data);


                if (personResult.data == '') {
                    //TODO: create a function that creates a new DT account and get that persona_id for returning
                    return [];
                } else {
                    var personaIDs = [];
                    personResult.data.forEach(function (element) {
                        personaIDs.push(element.persona.id)
                    });
                    return personaIDs;
                }
            }
            else{
                console.log("You aren't an admin, you can't do that");
                check(id, String);
                check(url_part, String);
                return '';
            }
        }
        catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
    },
    get_dt_funds: function () {
        try {
            //check to see that the user is the admin user
            if(this.userId === Meteor.settings.admin_user){
                logger.info("Started get_dt_funds");
                var fundResults;
                fundResults = HTTP.get(Meteor.settings.donor_tools_site + '/settings/funds.json?per_page=1000', {
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });
                Utils.separate_funds(fundResults.data);
                return fundResults.data;
            }else{
                console.log("You aren't an admin, you can't do that");
                return '';
            }

        } catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
    },
    insert_dt_persona: function (id, persona_id){
        try {
            //check to see that the user is the admin user
            if(this.userId === Meteor.settings.admin_user) {
                check(id, String);
                check(persona_id, String);
                logger.info("Started insert_dt_persona Meteor");

                //Create an array since that is how these function need to receive the persona_id
                var persona_array = [persona_id];

                //Insert this persona_id into the user account to link DT and this user
                Utils.insert_persona_id_into_user(id, persona_id);

                //Run this function to insert all the donations that exist (if any do) for the newly inserted persona_id
                Utils.get_all_dt_donations(persona_array);
            }
            else{
                console.log("You aren't an admin, you can't do that");
                check(id, String);
                check(url_part, String);
                return '';
            }
        }
        catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
    },
    insert_user_into_dt: function (id){
        try {
            check(id, String);
            logger.info("Started insert_user_into_dt");

            //check to see that the user is the admin user
            if(this.userId === Meteor.settings.admin_user) {

                var user = Meteor.users.findOne({_id: id});

                //TODO: check to see if the user exists or not. If it doesn't handle this by creating
                console.log(user._id);

                var newPersonResults;
                newPersonResults = HTTP.post(Meteor.settings.donor_tools_site + '/people.json', {
                    data: {
                        "persona": {
                            "names": [{
                                "first_name": "Support",
                                "last_name": "Trashmountain"
                            }],
                            "email_addresses": [{
                                "email_address": "support@trashmountain.com"
                            }]
                        }
                    },
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });

                console.dir(newPersonResults);
                console.dir(newPersonResults.data.persona.id);

                return newPersonResults;
            }
            else{
                console.log("You aren't an admin, you can't do that");
                return '';
            }
        }
        catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
    },
    insert_donation_into_dt: function (donation_id){
        /*try {*/
            //check to see that the user is the admin user
            check(donation_id, String);

            if(this.userId === Meteor.settings.admin_user) {
                logger.info("Started insert_donation_into_dt Meteor");

                var user_id = Meteor.users.findOne({'donations': donation_id})._id;
                var donation = Donations.findOne({_id: donation_id});
                console.log(donation.customer_id);
                var customer = Customers.findOne(donation.customer_id);
                console.log(customer._id);
                var source_id;
                var business_name;
                if (customer && customer.business_name){
                    business_name = customer.business_name;
                    source_id = 42776;
                }else
                    business_name = '';
                    source_id = 42754;

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
                            "received_on": '2015-02-06',
                            "source_id": source_id,
                            "find_or_create_person": {
                                "company_name": business_name,
                                "full_name": customer.name,
                                "email_address": customer.email
                            }
                        }
                    },
                    auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
                });

                console.dir(newDonationResult.data.donation);
                console.dir(newDonationResult.data.donation.persona_id);

                var persona_ids = [newDonationResult.data.donation.persona_id];
                Utils.get_all_dt_donations(persona_ids);
                Utils.insert_persona_id_into_user(Meteor.users.findOne({donations: donation_id})._id, newDonationResult.data.donation.persona_id);
                return newDonationResult;
            }
            else{
                alert("You aren't an admin, you can't do that");
                return '';
            }
        /*}
        catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }*/
    }
});
_.extend(Utils, {
    separate_donations: function(serverResponse){
        logger.info("Inside separate_donations");

        //Pull each donation from the array and send them to be inserted
        serverResponse.forEach(function (element) {
            Utils.insert_each_dt_donation(element.donation);
        });
    },
    insert_each_dt_donation: function(donation){
        logger.info("Inside insert_each_dt_donation with " + donation.id);

        //Insert each donation into the DT_donations collection
        donation._id = donation.id;
        logger.info(donation._id);
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
    get_dt_id: function (email, name, id, donation_id){
        try {
            //This function is used to get all of the persona_id s from DT
            logger.info("Started get_dt_id");
            var personResult;
            personResult = HTTP.get(Meteor.settings.donor_tools_site + "/people.json?search=" + email, {
                auth: Meteor.settings.donor_tools_user + ':' + Meteor.settings.donor_tools_password
            });

            var personaIDs = [];
            if(personResult.data == ''){
                Utils.send_dt_search_email(email, name, id, personaIDs, donation_id);
                return personaIDs;
            } else {
                personResult.data.forEach(function (element) {
                    personaIDs.push(element.persona.id)
                });

                Utils.send_dt_search_email(email, name, id, personaIDs, donation_id);
                return personaIDs;
            }
        } catch (e) {
            console.log(e);
            //e._id = AllErrors.insert(e.response);
            var error = (e.response);
            throw new Meteor.Error(error, e._id);
        }
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
        //This email allows the receipient to quickly check DT for the user by searching for their email
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
    }
});