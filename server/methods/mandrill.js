_.extend(Utils,{

	send_donation_email: function (recurring, id, amount, status, body, frequency, subscription) {
		try {
			logger.info("Started send_donation_email with ID: " + id);
        
			var charge_cursor = Charges.findOne({id: id});
            if(!charge_cursor){
                logger.error("No charge found here, exiting.");
                return;
            }
			var customer_cursor = Customers.findOne({_id: charge_cursor.customer});
            if(!customer_cursor){
                logger.error("No customer found here, exiting.");
                return;
            }
            var donation_cursor;
			if(subscription){
                donation_cursor = Donations.findOne({subscription_id: subscription});
                if(!donation_cursor){
                    logger.error("No donation found here, exiting.");
                    return;
                }
            } else {
                donation_cursor = Donations.findOne({charge_id: id});
                if(!donation_cursor){
                    logger.error("No donation found here, exiting.");
                    return;
                }
            }

			//var donateWithType  = charge_cursor.source.brand;

			//Get the donation with description for either the card or the bank account
			var donateWith = charge_cursor.source.brand;//Evts.get_donate_with(customer_cursor, charge_cursor.links.source);

			//var created_at = moment(new Date(Number(charge_cursor.created*1000))).format('MM/DD/YYYY h:mma');
			var created_at = '03/18/2015 7:09pm';
			var fees = donation_cursor.fees ? (donation_cursor.fees / 100).toFixed(2) : null;

			if(customer_cursor.business_name){
				var fullName = customer_cursor.metadata.business_name + "<br>" +
                    customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname;
			}else{
				var fullName = customer_cursor.metadata.fname + " " + customer_cursor.metadata.lname;
			}
			var audit_trail_cursor = Audit_trail.findOne({charge_id: id});
			var slug;
			var bcc_address = 'support@trashmountain.com';
			var email_address = customer_cursor.email;
			if (status === "charge.failed") {
                if(audit_trail_cursor && audit_trail_cursor.failed && audit_trail_cursor.charge.failed.sent) {
                    logger.info("A 'failed' email has already been sent for this charge, exiting email send function.");
                    return;
                }
                Utils.audit_email(id, status);
				slug = 'fall-2014-donation-failed';
			} else if(status === 'charge.pending'){
				if(audit_trail_cursor && audit_trail_cursor.created && audit_trail_cursor.charge.pending.sent) {
					logger.info("A 'created' email has already been sent for this charge, exiting email send function.");
					return;
				}
				Utils.audit_email(id, status);
				slug = "donation-initial-email";
				bcc_address = null;
			} else if (status === 'charge.succeeded'){
				if(audit_trail_cursor && audit_trail_cursor.succeeded && audit_trail_cursor.charge.succeeded.sent) {
					logger.info("A 'succeeded' email has already been sent for this charge, exiting email send function.");
					return;
				}
				Utils.audit_email(id, status);
				slug = "fall-2014-donation-receipt-multi-collection";
			} else if (status === 'large_gift') {
				if(audit_trail_cursor && audit_trail_cursor.large_gift && audit_trail_cursor.charge.large_gift.sent) {
					logger.info("A 'large_gift' email has already been sent for this charge, exiting email send function.");
					return;
				}
				Utils.audit_email(id, status);
				bcc_address = null;
				email_address = 'large_gift@trashmountain.com';
				slug = "large-gift-notice-multi-collection";
			}

	      logger.info("Sending with template name: " + slug);
	      Meteor.Mandrill.sendTemplate({
	        "template_name": slug,
	        "template_content": [
	          {}
	        ],
	        "message": {
	          "to": [
	              {"email": email_address}
	          ],
	          "bcc_address": bcc_address,
	          "merge_vars": [
	          {
	            "rcpt": email_address,
	            "vars": [
	            {
	              "name": "CreatedAt",
	              "content": created_at
	            },
	            {
	              "name": "DEV",
	              "content": Meteor.settings.dev
	            },
	              {
	                "name": "DonatedTo",
	                "content": donation_cursor.donateTo
	              }, {
						"name": "DonateWith",
						"content": donateWith
					}, {
	                "name": "GiftAmount",
	                "content": (donation_cursor.amount / 100).toFixed(2)
	              }, {
	                "name": "GiftAmountFees",
	                "content": fees
	              }, {
	                "name": "TotalGiftAmount",
	                "content": (donation_cursor.total_amount / 100).toFixed(2)
	              }, {
	                "name": "FailureReason",
	                "content": charge_cursor.failure_reason
	               },{
	                "name": "FailureReasonCode",
	                "content": charge_cursor.failure_reason_code
	              },{
					"name": "NAME",
					"content": customer_cursor.name
				},{
					"name": "FULLNAME",
					"content": fullName
				}, {
	                "name": "ORG",
	                "content": customer_cursor.metadata.business_name
	            }, {
	                "name": "ADDRESS_LINE1",
	                "content": customer_cursor.metadata.address_line1
	            }, {
	                "name": "ADDRESS_LINE2",
	                "content": customer_cursor.metadata.address_line2
	            }, {
	                "name": "LOCALITY",
	                "content": customer_cursor.metadata.city
	            }, {
	                "name": "REGION",
	                "content": customer_cursor.metadata.state
	            }, {
	                "name": "POSTAL_CODE",
	                "content": customer_cursor.metadata.postal_code
	            }, {
	                "name": "PHONE",
	                "content": customer_cursor.metadata.phone
	            }, {
	                "name": "c",
	                "content": customer_cursor._id
	            }, {
					"name": "don",
					"content": donation_cursor._id
				}, {
					"name": "charge",
					"content": charge_cursor._id
				}, {
	                "name": "CHARGEID",
	                "content": id
	            }, {
					"name": "URL",
					"content": donation_cursor.URL
				}, {
                    "name": "Frequency",
                    "content": frequency
                }
	            ]
	          }
	        ]
	      }
	      });
	    } //End try
	    catch (e) {
	      logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
	      logger.error('Mandril sendEmailOutAPI Method error: ' + e);
	      throw new Meteor.error(e);
	    }
	},
    send_scheduled_email: function (id, subscription_id, frequency, amount) {
        try {
        logger.info("Started send_donation_email with ID: " + id + " subscription_id: " + subscription_id + " frequency: " + frequency + "amount: " + amount);

        // Check to see if this email has already been sent before continuing, log it if it hasn't
        var subscription_cursor = Subscriptions.findOne({_id: subscription_id});
        if(Audit_trail.findOne({"subscription_id": subscription_id}) &&
            Audit_trail.findOne({"subscription_id": subscription_id}).subscription_scheduled &&
            Audit_trail.findOne({"subscription_id": subscription_id}).subscription_scheduled.sent){
            return;
        } else{
            Utils.audit_email(subscription_id, 'scheduled');
        }

        // Setup the rest of the cursors that we'll need
        var donation_cursor = Donations.findOne({_id: id});
        var customer_cursor = Customers.findOne(donation_cursor.customer_id);

        var start_at = subscription_cursor.trial_end;
        start_at = moment(start_at * 1000).format("MMM DD, YYYY");

        var bcc_address = "support@trashmountain.com";
        var email_address = customer_cursor.email;

        // convert the amount from an integer to a two decimal place number
        amount = (amount/100).toFixed(2);
        slug = "scheduled-donation-with-amount-and-frequency";

        logger.info("Sending with template name: " + slug);
        Meteor.Mandrill.sendTemplate({
            "key": Meteor.settings.mandrillKey,
            "template_name": slug,
            "template_content": [
                {}
            ],
            "message": {
                "to": [
                    {"email": email_address}
                ],
                "bcc_address": "support@trashmountain.com",
                "merge_vars": [
                    {
                        "rcpt": email_address,
                        "vars": [
                            {
                                "name": "StartDate",
                                "content": start_at
                            }, {
                                "name": "DEV",
                                "content": Meteor.settings.dev
                            }, {
                                "name": "SUB_GUID",
                                "content": subscription_id
                            }, {
                                "name": "Frequency",
                                "content": frequency
                            }, {
                                "name": "Amount",
                                "content": amount
                            }
                        ]
                    }
                ]
            }
        });
        } //End try
         catch (e) {
         logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
         logger.error('Mandril sendEmailOutAPI Method error: ' + e);
         throw new Meteor.error(e);
         }
    }
});