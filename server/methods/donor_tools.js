Meteor.methods({
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
    }
});