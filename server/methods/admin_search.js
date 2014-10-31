Meteor.methods({
    admin_search: function(search_string) {
    	if(this.userId !== Meteor.settings.admin_user) {
    		throw new Meteor.Error(500, "This user can't run this method");
    	}else{
    		if (search_string.substring(0, 2) == "TX") {
    			logger.info("Looking up a transaction from inside the admin panel");
	            var record = Donate.find({'transactions.guid': search_string}).fetch(); 
    			return record;
    		} else{
    			var records = Donate.find({$or: [ {_id: search_string}, {'customer.lname': search_string}, {'customer.fname': search_string}]}).fetch();
    			return records;
    		}
    	}
    }
});