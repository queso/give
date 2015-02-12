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
                    var insertThis = [];
                    _.each(donorResult.data, function(value) {
                        insertThis.push(value.donation)
                    });
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
    }
});