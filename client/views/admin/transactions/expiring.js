Template.Expiring.helpers({
    list: function () {
        //The subscription filters out the records with sub-document card,
        //which contain cards expiring in the next 3 months
        return Donate.find();
    },
    expiring_cards: function () {
        //This further filters only to the cards that match the above criteria
        // then returns an array to the Meteor template for the each loop
        var returnThisValue = [];
        this.card.forEach(function(entry) {
            var today = new Date();
            var future_date = new Date(new Date(today).setMonth(today.getMonth()+3));
            if (entry.expires <= future_date) {
                returnThisValue.push(entry);
            }
        });
        return returnThisValue;
    },
    fname: function (parent) {
        return parent.customer.fname;
    },
    lname: function (parent) {
        return parent.customer.lname;
    },
    email_address: function (parent) {
        return parent.customer.email_address;
    },
    phone_number: function (parent) {
        return parent.customer.phone_number;
    }
});

Template.Expiring.rendered = function () {
    $('.datatable').dataTable( {
        "columnDefs": [
            { className: "details-control", "targets": [ 0 ] }
        ]
    });

    //order by the date field
    $('#mainTable').dataTable().api().order(1, 'asc').draw();
};
