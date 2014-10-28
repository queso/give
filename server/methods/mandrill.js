_.extend(Utils,{
	large_gift_email: function (id, billy, debit_or_trans_id, amount){
	    try {
	      logger.info("Started large_gift_email with ID: " + id);
	      var lookup_record = Donate.findOne({_id: id});
	      if(!billy){
	      	var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
	      	var path = 'thanks';
	      	var transaction_guid = '';
	      }else {
	      	var created_at = moment(Date.parse(lookup_record.recurring.transactions[debit_or_trans_id].created_at)).format('MM/DD/YYYY');
	      	var path = 'gift';
	      	var transaction_guid = debit_or_trans_id;
	      }
	      if(lookup_record.customer.org){
	      	var fullName = lookup_record.customer.org + " <br>" + lookup_record.customer.fname + " " + lookup_record.customer.lname + " <br>";
	      } else{
	      	var fullName = lookup_record.customer.fname + " " + lookup_record.customer.lname + " <br>";
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
	                "email": "large_gift@trashmountain.com",
	            	}
			    ],
	          	"merge_vars": [
					{
					"rcpt": 'large_gift@trashmountain.com',
					"vars": [
						{
						"name": "CreatedAt",
						"content": created_at
						}, {
						"name": "DEV",
						"content": Meteor.settings.dev
						}, {
						"name": "DonatedTo",
						"content": lookup_record.debit.donateTo
						}, {
						"name": "DonateWith", //eventually send the card brand and the last four instead of just this
						"content": lookup_record.debit.donateWith
						}, {
						"name": "TotalGiftAmount",
						"content": amount / 100
						}, {
						"name": "FULLNAME",
						"content": fullName
						}, {
						"name": "ReceiptNumber",
						"content": id
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
	send_initial_email: function (id) {
	    try {
	      logger.info("Started send_initial_email with ID: " + id + " --------------------------");
	      var error = {};
	      var lookup_record = Donate.findOne({_id: id});
	      var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
	      logger.info(created_at);
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
	                "content": debit.amount / 100
	              }, {
	                "name": "GiftAmountFees",
	                "content": fees / 100
	              }, {
	                "name": "TotalGiftAmount",
	                "content": debit.total_amount / 100
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
	      var created_at = moment(Date.parse(lookup_record.created_at)).format('MM/DD/YYYY');
	      logger.info(created_at);
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
	                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
	                "content": debit.donateWith
	              }, {
	                "name": "GiftAmount",
	                "content": debit.amount / 100
	              }, {
	                "name": "GiftAmountFees",
	                "content": fees / 100
	              }, {
	                "name": "TotalGiftAmount",
	                "content": debit.total_amount / 100
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
	      
	      var lookup_record = Donate.findOne({_id: id});
	      var created_at = moment(lookup_record.recurring.transactions[transaction_guid].created_at).format('MM/DD/YYYY');
	      var debit = lookup_record.debit;
	      var customer = lookup_record.customer;
	      var fees = (debit.fees);
	      if(customer.org){
	        var fullName = customer.org + "<br>" + customer.fname + " " + customer.lname;
	      }else{
	        var fullName = customer.fname + " " + customer.lname;
	      }
	      logger.info("Cover the fees = " + debit.coveredTheFees);
	      logger.info("Transaction Status: " + lookup_record.recurring.transactions[transaction_guid].status);

	      var slug;
	      //TODO: Fix this so that it looks into the transaciton sub-document, not just into the top level, or when it fails, put the transaction GUID into the failed record 
	      //that is probably the way to go. 
	      if (status === "failed") {
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
	                "name": "ReceiptOrTransNumber",
	                "content": transaction_guid
	            },
	              {
	                "name": "DonatedTo",
	                "content": debit.donateTo
	              }, {
	                "name": "DonateWith", //eventually send the card brand and the last four instead of just this
	                "content": debit.donateWith
	              }, {
	                "name": "GiftAmount",
	                "content": debit.amount /100
	              }, {
	                "name": "GiftAmountFees",
	                "content": fees / 100
	              }, {
	                "name": "TotalGiftAmount",
	                "content": debit.total_amount / 100
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
	                "content": 'gift'
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
	}
});