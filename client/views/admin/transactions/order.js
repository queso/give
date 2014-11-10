Template.Order.events({
    'click .trans-table-row': function (e, tmpl) {
        e.preventDefault();
        Session.set("transaction_guid", this.guid);
        Session.set("transaction_amount", this.amount);
        Session.set("transaction_date", moment(this.updated_at).format("MM-DD-YYYY hh:mma"));
        Session.set("transaction_status", this.status);
        $('.transaction_details').show(300).fadeIn();
    }
});

Template.Order.helpers({
    order: function () {
        return this; //The subscription filters out the records marked viewable: false
    },
    fname: function() {
        return this.customer.fname;
    },
    lname: function() {
        return this.customer.lname;
    },
    amount: function() {
        return "$" + (this.debit.total_amount /100).toFixed(2);
    },
    order_id: function() {
        return this.order.id;
    },
    debit_id: function() {
        return this.debit.id;
    },
    status: function() {
        return this.debit.status;
    },
    order_date: function() {
        return this.created_at;
    },
    fund: function() {
        return this.debit.donateTo;
    }

});