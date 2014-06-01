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
   		return moment(this.created_at).format('HH:MM, MM/DD/YYYY');
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
   		return this.address_line2;
   	}else {
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
   		return this.phone_number;
   		
   },
   donateTo: function () {
   		return this.donateTo;
   },
   donateWith: function () {
   		return this.donateWith;
   },
   amount: function () {
         return this.amount;
   },
   total_amount: function () {
         return this.total_amount;
   }
});

/*****************************************************************************/
/* Receipt: Lifecycle Hooks */
/*****************************************************************************/
Template.Receipt.created = function () {
};

Template.Receipt.rendered = function () {
};

Template.Receipt.destroyed = function () {
};
