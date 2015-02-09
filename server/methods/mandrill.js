function get_billy_info (transaction_guid) {
	var the_info = {};
	the_info.mongo_doc = Donate.findOne({'transactions.guid': transaction_guid});
    the_info.transaction = _.findWhere(the_info.mongo_doc.transactions, { guid: transaction_guid });
	the_info.created_at = moment(the_info.transaction.created_at).format('MM/DD/YYYY');
	return the_info;
}

_.extend(Utils,{
	//Need to fix this after finding out what it should actually show here
	large_gift_email: function (billy, debit_or_trans_id, amount){
	    try {
	      logger.info("Started large_gift_email with ID: " + debit_or_trans_id);
	      
	      if(!billy){
	      	var the_info = {};
	      	the_info.mongo_doc = Donate.findOne({'debit.id': debit_or_trans_id});
	      	logger.info("large_gift_email the _id = " + the_info.mongo_doc._id);
	      	the_info.created_at = moment(the_info.mongo_doc.created_at).format('MM/DD/YYYY');
	      	var path = 'thanks';
	      	var transaction_guid = '';
	      }else {
	      	var the_info = get_billy_info(debit_or_trans_id);
	      	var path = 'gift';
	      	var transaction_guid = debit_or_trans_id;
	      }
	      if(the_info.mongo_doc.customer.org){
	      	var fullName = the_info.mongo_doc.customer.org + " <br>" + the_info.mongo_doc.customer.fname + " " + the_info.mongo_doc.customer.lname + " <br>";
	      } else{
	      	var fullName = the_info.mongo_doc.customer.fname + " " + the_info.mongo_doc.customer.lname + " <br>";
	      }
	      var slug = "large-gift-notice";

	      logger.info("Sending with template name: " + slug);
	      Meteor.Mandrill.sendTemplate({
	        "key": Meteor.settings.mandrillKey,
	        "template_name": slug,
	        "template_content": [
	          {}
	        ],
	        "message": {
	        	"to": [
	        	    {
	                "email": "large_gift@trashmountain.com"
	            	}
			    ],
	          	"merge_vars": [
					{
					"rcpt": 'large_gift@trashmountain.com',
					"vars": [
						{
						"name": "CreatedAt",
						"content": the_info.created_at
						}, {
						"name": "DEV",
						"content": Meteor.settings.dev
						}, {
						"name": "DonatedTo",
						"content": the_info.mongo_doc.debit.donateTo
						}, {
						"name": "DonateWith", //eventually send the card brand and the last four instead of just this
						"content": the_info.mongo_doc.debit.donateWith
						}, {
						"name": "TotalGiftAmount",
						"content": (the_info.mongo_doc.debit.total_amount / 100).toFixed(2)
						}, {
						"name": "FULLNAME",
						"content": fullName
						}, {
						"name": "ReceiptNumber",
						"content": the_info.mongo_doc._id
						}, {
						"name": "Path",
						"content": path
						}, {
						"name": "TransactionGUID",
						"content": transaction_guid
						}
		            ]
	          	}
	        ]	        
	      }
	      });
	    } //End try
	    catch (e) {
	      logger.error('Mandril large_gift_email Method error message: ' + e.message);
	      logger.error('Mandril large_gift_email Method error: ' + e);
	      throw new Meteor.error(e);
	    }
	},
	send_initial_email: function (id, billy, transaction_guid) {
	    try {
	      logger.info("Started send_initial_email with ID: " + id + " --------------------------");
	      var error = {};
	      var lookup_record = Donate.findOne({_id: id});
	      if(!billy){
	      	logger.info("Record id = " + lookup_record._id);
	      	var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
	      }else {
	      	logger.info("Record id = " + lookup_record._id);
	      	var lookup_record = Donate.findOne({'transactions.guid': transaction_guid});
	      	var lookup_transaction = Donate.findOne({'transactions.guid': transaction_guid}, {'transactions.guid': 1});
	      	var transaction = _.findWhere(lookup_transaction.transactions, { guid: transaction_guid });
	      	var created_at = moment(Date.parse(transaction.created_at)).format('MM/DD/YYYY');
		}

	      var debit = lookup_record.debit;
	      var customer = lookup_record.customer;
	      var fees = debit.fees;
	      if(customer.org){
	        var fullName = customer.org + "<br>" + customer.fname + " " + customer.lname;
	      }else{
	        var fullName = customer.fname + " " + customer.lname;
	      } 
	      logger.info("Cover the fees = " + debit.coveredTheFees);
	      logger.info("debit.status: " + debit.status);
	      var slug;
	      if (debit.status === "failed") {
	        return '';
	        } else {
	        slug = "donation-initial-email";
	      }
	      logger.info("Sending with template name: " + slug);
	      Meteor.Mandrill.sendTemplate({
	        "key": Meteor.settings.mandrillKey,
	        "template_name": slug,
	        "template_content": [
	          {}
	        ],
	        "message": {
	          "to": [
	            {"email": customer.email_address}
	          ],
	          "merge_vars": [
	          {
	            "rcpt": customer.email_address,
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
	                "content": debit.donateTo
	              }, {
	                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
	                "content": debit.donateWith
	              }, {
	                "name": "GiftAmount",
	                "content": (debit.amount / 100).toFixed(2)
	              }, {
	                "name": "GiftAmountFees",
	                "content": (fees / 100).toFixed(2)
	              }, {
	                "name": "TotalGiftAmount",
	                "content": (debit.total_amount / 100).toFixed(2)
	              }, {
	                "name": "FailureReason",
	                "content": error.failure_reason
	               },{
	                "name": "FailureReasonCode",
	                "content": error.failure_reason_code
	              },{
	                "name": "FULLNAME",
	                "content": fullName
	            },{
	                "name": "ORG",
	                "content": customer.org
	            },{
	                "name": "ADDRESS_LINE1",
	                "content": customer.address_line1
	            }, {
	                "name": "ADDRESS_LINE2",
	                "content": customer.address_line2
	            }, {
	                "name": "LOCALITY",
	                "content": customer.city
	            }, {
	                "name": "REGION",
	                "content": customer.region
	            }, {
	                "name": "POSTAL_CODE",
	                "content": customer.postal_code
	            }, {
	                "name": "PHONE",
	                "content": customer.phone_number
	            }, {
	                "name": "ReceiptNumber",
	                "content": id
	            }, {
	                "name": "Path",
	                "content": 'thanks'
	            }, {
	                "name": "ReceiptOrTransNumber",
	                "content": id
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
    send_one_time_email: function (id) {
	    try {
	      logger.info("Started send_one_time_email with ID: " + id + " --------------------------");
	      var error = {};
	      var lookup_record = Donate.findOne({_id: id});
			var payment_type = lookup_record.card ? lookup_record.card[0] : lookup_record.bank_account[0];
	      var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
	      var debit = lookup_record.debit;
	      var customer = lookup_record.customer;
	      var fees = debit.fees;
	      var transaction_guid = '';
	      if(customer.org){
	        var fullName = customer.org + "<br>" + customer.fname + " " + customer.lname;
	      }else{
	        var fullName = customer.fname + " " + customer.lname;
	      }
	      logger.info("Cover the fees = " + debit.coveredTheFees);
	      logger.info("debit.status: " + debit.status);
	      var slug;
	      if (debit.status === "failed") {
	        error = lookup_record.failed;
	        slug = "failedpayment";
	        } else if (debit.coveredTheFees){
	        slug = "fall-2014-donation-electronic-receipt-with-fees";
	      } else {
	        slug = "fall-2014-donation-electronic-receipt";
	      }
	      logger.info("Sending with template name: " + slug);
	      Meteor.Mandrill.sendTemplate({
	        "key": Meteor.settings.mandrillKey,
	        "template_name": slug,
	        "template_content": [
	          {}
	        ],
	        "message": {
	          "to": [
	              {"email": customer.email_address}
	          ],
	          "bcc_address": "support@trashmountain.com",
	          "merge_vars": [
	          {
	            "rcpt": customer.email_address,
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
	                "content": debit.donateTo
	              }, {
	                "name": "DonateWith",
	                "content": debit.donateWith === 'Card' ? payment_type.brand ? payment_type.brand + ', ending in ' + payment_type.number.slice(-4) : 'Card ending in ' + payment_type.number.slice(-4) : payment_type.bank_name + ', ending in ' + payment_type.account_number.slice(-4)
					}, {
	                "name": "GiftAmount",
	                "content": (debit.amount / 100).toFixed(2)
	              }, {
	                "name": "GiftAmountFees",
	                "content": (fees / 100).toFixed(2)
	              }, {
	                "name": "TotalGiftAmount",
	                "content": (debit.total_amount / 100).toFixed(2)
	              }, {
	                "name": "FailureReason",
	                "content": error.failure_reason
	               },{
	                "name": "FailureReasonCode",
	                "content": error.failure_reason_code
	              },{
	                "name": "FULLNAME",
	                "content": fullName
	            }, {
	                "name": "ORG",
	                "content": customer.org
	            }, {
	                "name": "ADDRESS_LINE1",
	                "content": customer.address_line1
	            }, {
	                "name": "ADDRESS_LINE2",
	                "content": customer.address_line2
	            }, {
	                "name": "LOCALITY",
	                "content": customer.city
	            }, {
	                "name": "REGION",
	                "content": customer.region
	            }, {
	                "name": "POSTAL_CODE",
	                "content": customer.postal_code
	            }, {
	                "name": "PHONE",
	                "content": customer.phone_number
	            }, {
	                "name": "ReceiptNumber",
	                "content": id
	            }, {
	                "name": "Path",
	                "content": 'thanks'
	            }, {
	                "name": "ReceiptOrTransNumber",
	                "content": id
	            }, {
	                "name": "TransactionGUID",
	                "content": transaction_guid
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
    send_billy_email: function (id, transaction_guid, status) {
	    try {
	      logger.info("Started send_billy_email with ID: " + id + " --------------------------");
	      logger.info("Started send_billy_email with transaction_guid: " + transaction_guid + " --------------------------");
	      logger.info("Started send_billy_email with status: " + status + " --------------------------");
	      var error = {};
	      
	      var lookup_record = Donate.findOne({'transactions.guid': transaction_guid}, {'transactions.$': 1});
			var payment_type = lookup_record.card ? lookup_record.card[0] : lookup_record.bank_account[0];
          var transaction = _.findWhere(lookup_record.transactions, { guid: transaction_guid });
	      var created_at = moment(Date.parse(transaction.created_at)).format('MM/DD/YYYY');

	      var lookup_trans = get_billy_info(transaction_guid);
	      var debit = lookup_record.debit;
	      var customer = lookup_record.customer;
	      var fees = (debit.fees);
	      if(customer.org){
	        var fullName = customer.org + "<br>" + customer.fname + " " + customer.lname;
	      }else{
	        var fullName = customer.fname + " " + customer.lname;
	      }
	      logger.info("Cover the fees = " + debit.coveredTheFees);
	      logger.info("Transaction Status: " + transaction.status);

	      var slug;
	      //TODO: Fix this so that it looks into the transaciton sub-document, not just into the top level, or when it fails, put the transaction GUID into the failed record 
	      //that is probably the way to go. 
	      if (status === "failed") {
	        error = Donate.findOne({_id: id}).failed;
	        slug = "failedpayment";
	        } else if (debit.coveredTheFees){
	        slug = "fall-2014-donation-electronic-receipt-with-fees";
	      } else {
	        slug = "fall-2014-donation-electronic-receipt";
	      }
	      logger.info("Sending with template name: " + slug);
	      Meteor.Mandrill.sendTemplate({
	        "key": Meteor.settings.mandrillKey,
	        "template_name": slug,
	        "template_content": [
	          {}
	        ],
	        "message": {
	            "to": [
	              {"email": customer.email_address}
	            ],
	          "bcc_address": "support@trashmountain.com",
	          "merge_vars": [
	          {
	            "rcpt": customer.email_address,
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
	                "name": "ReceiptOrTransNumber",
	                "content": transaction_guid
	            },
				{
					"name": "DonatedTo",
					"content": debit.donateTo
				},
				{
					"name": "DonateWith",
					"content": debit.donateWith === 'Card' ? payment_type.brand ? payment_type.brand + ', ending in ' + payment_type.number.slice(-4) : 'Card ending in ' + payment_type.number.slice(-4) : payment_type.bank_name + ', ending in ' + payment_type.account_number.slice(-4)
				},
				{
	                "name": "GiftAmount",
	                "content": (debit.amount /100).toFixed(2)
				},
				{
	                "name": "GiftAmountFees",
	                "content": (fees / 100).toFixed(2)
	            },
				{
	                "name": "TotalGiftAmount",
	                "content": (debit.total_amount / 100).toFixed(2)
	            },
				{
	                "name": "FailureReason",
	                "content": error.failure_reason
	             },
				{
	                "name": "FailureReasonCode",
	                "content": error.failure_reason_code
	            },
				{
	                "name": "FULLNAME",
	                "content": fullName
	            },
				{
	                "name": "ORG",
	                "content": customer.org
	            },
				{
	                "name": "ADDRESS_LINE1",
	                "content": customer.address_line1
	            },
				{
	                "name": "ADDRESS_LINE2",
	                "content": customer.address_line2
	            },
				{
	                "name": "LOCALITY",
	                "content": customer.city
	            },
				{
	                "name": "REGION",
	                "content": customer.region
	            },
				{
	                "name": "POSTAL_CODE",
	                "content": customer.postal_code
	            },
				{
	                "name": "PHONE",
	                "content": customer.phone_number
	            },
				{
	                "name": "ReceiptNumber",
	                "content": id
	            },
				{
	                "name": "Path",
	                "content": 'gift'
	            },
				{
	                "name": "TransactionGUID",
	                "content": transaction_guid
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
    send_scheduled_email: function (id, subscription_guid) {
        /*try {*/
        logger.info("Started send_donation_email with ID: " + id);

        var donate_cursor = Donate.findOne({_id: id});
        var started_at = donate_cursor.subscriptions[0].started_at;

        started_at = moment(started_at).format("MMM DD, YYYY");
        console.log(started_at);

        var bcc_address = "support@trashmountain.com";
        var email_address = donate_cursor.customer.email_address;
        console.log(email_address);
        slug = "scheduled-donation";

        //Evts.update_email_collection(id, 'scheduled');

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
                                "content": started_at
                            }, {
                                "name": "DEV",
                                "content": Meteor.settings.dev
                            }, {
                                "name": "SUB_GUID",
                                "content": subscription_guid
                            }
                        ]
                    }
                ]
            }
        });
        /*} //End try
         catch (e) {
         logger.error('Mandril sendEmailOutAPI Method error message: ' + e.message);
         logger.error('Mandril sendEmailOutAPI Method error: ' + e);
         throw new Meteor.error(e);
         }*/
    }
});