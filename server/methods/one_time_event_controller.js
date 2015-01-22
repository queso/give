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
				logger.info(body.events[0].entity.debits[0].id);
	 			var sending_email_for_created = Evts.send_email(false, body.events[0].entity.debits[0].id, null, null, 'initial_sent', status, body.events[0].entity.debits[0].amount);
	 		}else if(select_type === "debit_succeeded") {
		 		var amount = Donate.findOne({'debit.id': body.events[0].entity.debits[0].id}).debit.total_amount;

                if(amount === body.events[0].entity.debits[0].amount) {	
			 		if(amount > 50000){
			 			var large_gift_email = 	Utils.large_gift_email(false, body.events[0].entity.debits[0].id, body.events[0].entity.debits[0].amount);
			 		}
		 			var sending_email = 	Evts.send_email(false, body.events[0].entity.debits[0].id, null, null, 'succeeded_sent', status, body.events[0].entity.debits[0].amount);
		 			var route_type =        Event_types[select_type](false, null, null, body.events[0].entity.debits[0].id);
	 			} else{
                    logger.error("The amount from the received event and the amount of the debit do not match!");
                }
	 		}if(select_type === "debit_failed"){
	 			var failed_update = Evts.failed_collection_update(false, type, body.events[0].entity.debits[0].id, null, body);
	 		}
 		} else{
            logger.info("************* Received an event and didn't do anything with it.");
        }
	}
	
});