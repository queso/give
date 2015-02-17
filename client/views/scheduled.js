Template.DonationScheduled.helpers({
    frequency: function () {
        return Session.get('params.frequency');
    },
    amount: function () {
        return Session.get('params.amount');
    },
    start_date: function () {
        return Session.get('params.start_date');
    }
})