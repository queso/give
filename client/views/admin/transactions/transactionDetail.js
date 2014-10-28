/*****************************************************************************/
/* transactionDetail: Event Handlers and Helpers */
/*****************************************************************************/
Template.transactionDetail.events({
});

Template.transactionDetail.helpers({
    billy: function () {
      return (this.recurring);
    },
   receiptNumber: function () {
   		return this._id;
   },
   transaction_guid: function () {
    var transaction_guid = Session.get('transaction_guid');
    return transaction_guid;
   },
   date: function () {
   		return moment(this.debit.created_at).format('MM/DD/YYYY');
   },
   transaction_date: function () {
      var transaction_guid = Session.get('transaction_guid');
      return moment(this.recurring.transactions[transaction_guid].updated_at).format('MM/DD/YYYY hh:mma');
   },
   org: function () {
    if (this.customer.org){
      return this.customer.org + "<br>"
    }
   },
   fname: function () {
   		return this.customer.fname;
   },
   lname: function () {
   		return this.customer.lname;
   },
   address_line1: function () {
   		return this.customer.address_line1;
   },
   address_line2: function () {
   	if(this.customer.address_line2) {
   		return "<br>" + this.customer.address_line2;
   	} else {
   		return false;
   	}
   },
   city: function () {
   		return this.customer.city;
   },
   region: function () {
   		return this.customer.region;
   },
   postal_code: function () {
   		return this.customer.postal_code;
   },
   country: function () {
   		if(this.customer.country === 'US') {
   			return;
   		}else {
   			return this.customer.country;
   		}
   },
   email_address: function () {
   		return this.customer.email_address;
   },
   phone_number: function () {
      if(this.customer.phone_number !== '') {
         return this.customer.phone_number;
      } else {
         return false;
      }   		
   },
   donateTo: function () {
   		return this.debit.donateTo;
   },
   donateWith: function () {
      //need to add the last four digits of the account numer here
   		return this.debit.donateWith;
   },
   amount: function () {
          if(this.debit.amount){
          return (this.debit.amount / 100);   
          }else {
            return '';   
          }
         
   },
   total_amount: function () {
      if(this.debit.total_amount){
        return (this.debit.total_amount / 100);   
      }else {
       return '';   
      }
   },
    fees: function () {
        if(this.debit.fees && this.debit.total_amount){
            return '\
            <tr>\
                <th>Covered fees:</th>\
                <td></td>\
                <td>$' + (this.debit.fees / 100) + '</td>\
            </tr>\
            <tr>\
                <th>Total:</th>\
                <td></td>\
                <td>$' + (this.debit.total_amount / 100)+ '</td>\
            </tr>';
        } else {
        return "";
        }
    },
    paymentLink: function(parent) {
      return '<a href="https://dashboard.balancedpayments.com/' + Meteor.settings.public.balanced_payments_uri + (this.bank_account ? this.bank_account.href: this.card.href) + '" target="_blank">' + this.bank_account ? this.bank_account.number: this.card.number + '</a>';
    }
});

/*****************************************************************************/
/* transactionDetail: Lifecycle Hooks */
/*****************************************************************************/

Template.transactionDetail.rendered = function () {
  Session.set("transaction_guid", '');
  Session.set("transaction_amount", '');
  Session.set("transaction_date", '');
  Session.set("transaction_status", '');
};
