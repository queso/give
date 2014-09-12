/*****************************************************************************/
/* Receipt: Event Handlers and Helpers */
/*****************************************************************************/

Template.Receipt.events({
  /*
   * Example: 
   *  'click .selector': function (e, tmpl) {
   *
   *  }
   */
});

Template.Receipt.helpers({
   receiptNumber: function () {
   		return this._id;
   },
   date: function () {
   		return moment(this.debit.created_at).format('MM/DD/YYYY');
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
         return this.debit.amount;
   },
   total_amount: function () {
         return this.debit.total_amount;
   },
    fees: function () {
        if(this.debit.amount !== this.debit.total_amount){
            console.log("Got here");
            return '\
            <tr>\
                <th>Covered fees:</th>\
                <td></td>\
                <td>$' + this.debit.fees + '</td>\
            </tr>\
            <tr>\
                <th>Total:</th>\
                <td></td>\
                <td>$' + this.debit.total_amount + '</td>\
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

    if (Session.equals('params.print', 'yes')) {
        //$('.modal').remodal
    }
};

Template.Receipt.destroyed = function () {
};

