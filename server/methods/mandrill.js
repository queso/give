_.extend(Utils,{
	send_donation_email: function (billy, id, trans_guid, amount, status) {
		try {
			logger.info("Started send_donation_email with ID: " + id);

			var debit_cursor = Debits.findOne({id: id});
			var customer_cursor = Customers.findOne({_id: debit_cursor.customer_id});
			var donation_cursor = Donations.findOne({_id: debit_cursor.donation_id});
			var donateWithType  = donation_cursor.type;

			//Get the donation with description for either the card or the bank account
			var donateWith = Evts.get_donate_with(customer_cursor, debit_cursor.links.source);

			var created_at = moment(Date.parse(debit_cursor.created_at)).format('MM/DD/YYYY');
			var fees = donation_cursor.fees ? (donation_cursor.fees / 100).toFixed(2) : null;

			if(customer_cursor.business_name){
				var fullName = customer_cursor.business_name + "<br>" + customer_cursor.name;
			}else{
				var fullName = customer_cursor.name;
			}
			var email_cursor = Emails.findOne({balanced_debit_id: id});
			var slug;
			var bcc_address = 'support@trashmountain.com';
			var email_address = customer_cursor.email;
			if (status === "failed") {
				slug = 'fall-2014-donation-failed';
			} else if(status === 'created'){
				if(email_cursor && email_cursor.created && email_cursor.created.sent) {
					console.log("A 'created' email has already been sent for this debit, exiting email send function.");
					return;
				}
				Evts.update_email_collection(id, 'created');
				slug = "donation-initial-email";
				bcc_address = null;
			} else if (status === 'succeeded'){
				if(email_cursor && email_cursor.succeeded && email_cursor.succeeded.sent) {
					console.log("A 'succeeded' email has already been sent for this debit, exiting email send function.");
					return;
				}
				Evts.update_email_collection(id, 'succeeded');
				slug = "fall-2014-donation-receipt-multi-collection";
			} else if (status === 'large_gift') {
				if(email_cursor && email_cursor.large_gift && email_cursor.large_gift.sent) {
					console.log("A 'large_gift' email has already been sent for this debit, exiting email send function.");
					return;
				}
				Evts.update_email_collection(id, 'large_gift');
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
	                "content": debit_cursor.failure_reason
	               },{
	                "name": "FailureReasonCode",
	                "content": debit_cursor.failure_reason_code
	              },{
					"name": "NAME",
					"content": customer_cursor.name
				},{
					"name": "FULLNAME",
					"content": fullName
				}, {
	                "name": "ORG",
	                "content": customer_cursor.business_name
	            }, {
	                "name": "ADDRESS_LINE1",
	                "content": customer_cursor.address.line1
	            }, {
	                "name": "ADDRESS_LINE2",
	                "content": customer_cursor.address.line2
	            }, {
	                "name": "LOCALITY",
	                "content": customer_cursor.address.city
	            }, {
	                "name": "REGION",
	                "content": customer_cursor.address.state
	            }, {
	                "name": "POSTAL_CODE",
	                "content": customer_cursor.address.postal_code
	            }, {
	                "name": "PHONE",
	                "content": customer_cursor.phone
	            }, {
	                "name": "c",
	                "content": customer_cursor._id
	            }, {
					"name": "don",
					"content": donation_cursor._id
				}, {
					"name": "deb",
					"content": debit_cursor._id
				}, {
	                "name": "DEBITID",
	                "content": id
	            }, {
	                "name": "TransactionGUID",
	                "content": trans_guid
	            },{
					"name": "URL",
					"content": donation_cursor.URL
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