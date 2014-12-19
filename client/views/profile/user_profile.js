Template.UserProfile.helpers({
    user: function () {
        return Meteor.users.findOne();
    },
    name: function () {
        return this.profile.name;
    },
    email: function () {
        return Meteor.users.findOne().emails[0].address;
    },
    showHistory: function () {
        return Session.get("showHistory");
    },
    donation: function () {
        return Donations.find();
    },
    total_amount: function () {
        return this.total_amount / 100;
    },
    debits: function () {
        return Debits.find();
    },
    given: function () {
        var debits = Debits.find();
        var total = 0;
        var count = 0;
        debits.forEach(function (cursor) {
            total = total + cursor.amount;
            count += 1;
        });
        return {total: total/100, count: count};
    },
    categories: function () {
        var donations = Donations.find();
        var categories = 1;
        var lastCategory = donations.fetch()[0].donateTo;
        donations.forEach(function (cursor) {
            if(cursor.donateTo !== lastCategory) {
                categories += 1;
                lastCategory = cursor.donateTo;
            }
        });
        return categories;
    },
    customer: function () {
        return Customers.findOne();
    },
    address_line2: function () {
        if(Customers.findOne().address.line2) {
            return '<span class="tags">' + Customers.findOne().address.line2 + '</span> <br>';
        } else return;
    },
    business_name: function () {
        if(Customers.findOne().business_name) {
            return '<h5>' + Customers.findOne().business_name + '</h5>';
        } else return;
    }

});

Template.UserProfile.events({
    'click #viewHistory': function() {
        Session.set("showHistory", true);
    }
});

Template.UserProfile.rendered = function(){
   Session.set("showHistory", false);
};
