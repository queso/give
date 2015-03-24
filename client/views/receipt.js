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
    customer_data: function () {
        return Customers.findOne().metadata;
    },
    charges: function () {
        return Charges.findOne();
    },
    frequency: function () {
        if(Charges.findOne() && Charges.findOne().invoice){
            return Charges.findOne().metadata.frequency;
        }else{
            return 'One time';
        }

    },
   date: function () {
   		return moment(this.created_at).format('MM/DD/YYYY');
   },
    business_name: function () {
        if (this.business_name){
          return this.business_name + "<br>"
        }
   },
    address_line2: function () {
   	if(this.address_line2) {
   		return "<br>" + this.address_line2;
   	} else {
   		return false;
   	}
   },
    country_code: function () {
   		if(this.country === 'US' || this.country === null) {
   			return;
   		}else {
   			return this.country;
   		}
    },
    email: function () {
        return this.email;
    },
    phone: function () {
        if(this.phone !== '') {
         return this.phone;
        } else {
         return false;
        }
    },
    donateTo: function () {
        return this.donateTo;
},
    donateWith: function () {
        var source = Charges.findOne().links.source;
        if(source.slice(0,2) === 'CC'){
            var card = _.findWhere(this.cards, {id: source});
                return card.brand + ", ending in " + card.number.slice(-4);
        } else if (source.slice(0,2) === 'BA'){
            var bank_account = _.findWhere(this.bank_accounts, {id: source});
            return  bank_account.bank_name +  ", ending in " + bank_account.account_number.slice(-4);
        }
   },
   amount: function () {
          if(this.amount){
          return (this.amount / 100).toFixed(2);
          }else {
            return '';   
          }
         
   },
   total_amount: function () {
      if(this.total_amount){
        return (this.total_amount / 100).toFixed(2);
      }else {
       return '';   
      }
   },
    fees: function () {
        if(this.fees && this.total_amount){
            return '\
            <tr>\
                <th>Covered fees:</th>\
                <td></td>\
                <td>$' + (this.fees / 100).toFixed(2) + '</td>\
            </tr>\
            <tr>\
                <th>Total:</th>\
                <td></td>\
                <td>$' + (this.total_amount / 100).toFixed(2) + '</td>\
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

