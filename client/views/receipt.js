/*****************************************************************************/
/* Receipt: Event Handlers and Helpers */
/*****************************************************************************/
Template.Receipt.events({
  'click #matchLink': function (){
    e.preventDefault();
    window.location.href = "https://trashmountain.com/match";
  }
});

Template.Receipt.helpers({
    billy: function () {
      return (this.isRecurring);
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
    var transaction = _.findWhere(this.transactions, { guid: transaction_guid });    
      return moment(transaction.updated_at).format('MM/DD/YYYY');
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
      var payment_device;
      if(this.card){
        payment_device = this.card[0].number
        return "Card (last four) " + payment_device.slice(-4);
      } else {
        payment_device = this.bank_account[0].account_number
        return "Bank account (last four) " + payment_device.slice(-4);
      }   		
   },
   amount: function () {
          if(this.debit.amount){
          return (this.debit.amount / 100).toFixed(2);
          }else {
            return '';   
          }
         
   },
   total_amount: function () {
      if(this.debit.total_amount){
        return (this.debit.total_amount / 100).toFixed(2);
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
                <td>$' + (this.debit.fees / 100).toFixed(2) + '</td>\
            </tr>\
            <tr>\
                <th>Total:</th>\
                <td></td>\
                <td>$' + (this.debit.total_amount / 100).toFixed(2) + '</td>\
            </tr>';
        } else {
        return "";
        }
    }
});

/*****************************************************************************/
/* Receipt: Lifecycle Hooks */
/*****************************************************************************/
Template.Receipt.created = function () {
};

Template.Receipt.rendered = function () {
  $.fn.scrollView = function () {
      return this.each(function () {
          $('html, body').animate({
              scrollTop: $(this).offset().top
          }, 1000);
      });
  }
  $('#invoice').scrollView();
  
  //Look for print url param and if it is set to yes, send the js command to show the print dialog
  if (Session.equals('print', 'yes')) {
      return window.print();
  }
};

Template.Receipt.destroyed = function () {
};

