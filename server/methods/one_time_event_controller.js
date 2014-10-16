_.extend(Evts,{
	one_time_controller: function(body) {
		var type = Object.keys(body.events[0].entity)[0];
		logger.info(type);
		if(type === "debits"){
			logger.info("Inside one_time_controller and debits area");
			var status = 		body.events[0].entity[type][0].status;
			var select_type = 	Evts.select_type(body);
			logger.info(select_type);
			if(select_type === "debit_created") {
	 			var sending_email_for_created = Evts.send_received_email(false, body.events[0].entity.debits[0].id, null, status, body.events[0].entity.debits[0].amount);
	 		}else if(select_type === "debit_succeeded") {
	 			var sending_email = 	Evts.send_email(false, body.events[0].entity.debits[0].id, null, status, body.events[0].entity.debits[0].amount);
	 			var route_type =        Event_types[select_type](false, billy_id, transaction_guid, body);
	 		}if(select_type === "debit_failed"){
	 			var failed_update = Evts.failed_collection_update(false, type, body.events[0].entity.debits[0].id, null, body);
	 		}
 		} else{
            logger.info("************* Received an event and didn't do anything with it.");
        }
	}
	
});