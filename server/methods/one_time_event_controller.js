_.extend(Evts,{
	one_time_controller: function(body) {
		if(type === "debits"){
			var type = Evts.select_type(body);
			if(select_type === "debit_created") {
	 			var sending_email_for_created = Evts.send_received_email(false, id, body);
	 		}else if(select_type === "debit.succeeded") {
	 			var sending_email = Evts.send_email(false, id, body);
	 		}if(select_type === "debit.failed"){
	 			var failed_update = Evts.failed_collection_update(false, 'debits', body.events[0].entity.debits[0].id, null, body);
	 		}
 		} else{
            logger.info("************* Received an event and didn't do anything with it.");
        }
	}
	
});