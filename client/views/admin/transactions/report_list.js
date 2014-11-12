Template.Report_list.helpers({
    transaction_guid: function () {
        return this.guid;
    },
    id: function (parent) {
        return parent._id;
    },
    subscription_guid: function () {
        return this.subscription_guid;
    },
    name: function (parent) {
        return parent.customer.fname + " " + parent.customer.lname;
    },
    isReucrring: function (parent) {
        return parent.isRecurring;
    },
    amount: function() {
        return this.amount / 100;
    },
    gift_date: function () {
        return moment(this.created_at).format('MM/DD/YYYY');
    }

});