/*****************************************************************************/
/* Receipt: Event Handlers and Helpers */
/*****************************************************************************/
Template.Receipt.events({
  'click #matchLink': function (e){
    e.preventDefault();
    window.location.href = "https://trashmountain.com/match";
  }
});

Template.Receipt.helpers({
    donation: function () {
        return Donations.findOne();
    },
    customer: function () {
        return Customers.findOne();
    },
    debit: function () {
        return Debits.findOne();
    },
    billy: function () {
      return (this.subscriptions);
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
    if (this.org){
      return this.org + "<br>"
    }
   },
   fname: function () {
   		return this.fname;
   },
   lname: function () {
   		return this.lname;
   },
   address_line1: function () {
   		return this.address_line1;
   },
   address_line2: function () {
   	if(this.address_line2) {
   		return "<br>" + this.address_line2;
   	} else {
   		return false;
   	}
   },
   city: function () {
   		return this.city;
   },
   region: function () {
   		return this.region;
   },
   postal_code: function () {
   		return this.postal_code;
   },
   country: function () {
   		if(this.country === 'US') {
   			return;
   		}else {
   			return this.country;
   		}
   },
   email_address: function () {
   		return this.email_address;
   },
   phone_number: function () {
      if(this.phone_number !== '') {
         return this.phone_number;
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
          if(this.card[0].number && this.card[0].brand) {
              payment_device = this.card[0].number;
              return this.card[0].brand + ", ending in " + payment_device.slice(-4);
          } else {
              return 'Card';
          }
      } else {
          if(this.bank_account && this.bank_account[0].account_number && this.bank_account[0].bank_name) {
              payment_device = this.bank_account[0].account_number;
              return  this.bank_account[0].bank_name +  ", ending in " + payment_device.slice(-4);
          } else {
              return 'Check';
          }
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

