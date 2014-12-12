function get_billy_info (transaction_guid) {
	var the_info = {};
	the_info.mongo_doc = Donate.findOne({'transactions.guid': transaction_guid});
    the_info.transaction = _.findWhere(the_info.mongo_doc.transactions, { guid: transaction_guid });
	the_info.created_at = moment(the_info.transaction.created_at).format('MM/DD/YYYY');
	return the_info;
}

_.extend(Utils,{
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
	        	"to": [{"email": "large_gift@trashmountain.com"}],
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
	send_donation_email: function (billy, id, trans_guid, amount, status) {
		try {
			logger.info("Started send_receipt_email with ID: " + id);

			var debit_cursor = Debits.findOne({id: id});
			var customer_cursor = Customers.findOne({_id: debit_cursor.customer_id});
			var donation_cursor = Donations.findOne({_id: debit_cursor.donation_id});
			var donateWithType  = donation_cursor.type;

			//Get the donation with description for either the card or the bank account
			var donateWith = Evts.get_donate_with(customer_cursor, debit_cursor.links.source)

			var created_at = moment(Date.parse(debit_cursor.created_at)).format('MM/DD/YYYY');
			var fees = donation_cursor.fees ? (donation_cursor.fees / 100).toFixed(2) : null;

			if(customer_cursor.business_name){
				var fullName = customer_cursor.business_name + "<br>" + customer_cursor.name;
			}else{
				var fullName = customer_cursor.name;
			}

			var slug;
			if (status === "failed") {
				slug = 'fall-2014-donation-failed';
			} else if(status === 'created'){
				slug = "donation-initial-email";
			} else if (status === 'succeeded'){
				slug = "fall-2014-donation-receipt-multi-collection";
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
	              {"email": customer_cursor.email}
	          ],
	          "bcc_address": "support@trashmountain.com",
	          "merge_vars": [
	          {
	            "rcpt": customer_cursor.email,
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