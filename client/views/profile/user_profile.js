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
        return Donations.find({}, {sort: {created_at: 1}});
    },
    donationItem: function(id){
        var donation_cursor;
        if( donation_cursor = Donations.findOne(id)){
            if(donation_cursor.donateTo){
                return donation_cursor.donateTo;
            }
            else return;
        }
        else return;
    },
    total_amount: function () {
        return this.total_amount / 100;
    },
    debits: function () {
        return Debits.find({}, {sort: {created_at: -11}});
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
        var donations = Donations.find({}, {sort: {donateTo: 1}});
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
    },
    giving_focus: function () {
        var donations = Donations.find().fetch();
        var orgs = {};

        _.each(donations, function(donation) {
            if (orgs[donation.donateTo] == null)
                orgs[donation.donateTo] = 0;
            orgs[donation.donateTo] += donation.amount;
        });

        var amount = _.max(_.values(orgs));
        var donateTo = _.invert(orgs)[amount];
        var count = _.where(donations, {donateTo: donateTo}).length;
        var result = {donateTo: donateTo, amount: amount, count: count};
        return result.donateTo === 'Honduras Urgent' ? '<img src="https://trashmountain.com/system/wp-content/uploads/2014/12/Honduras-01.svg" alt="" class="img-circle img-responsive">' : result.donateTo;
    }

});

Template.UserProfile.events({
    'click #viewHistory': function() {
        Session.set("showHistory", true);
    },
    'click .edit_address': function () {
        //setup modal for entering give toward information
        $('#modal_for_address_change').modal({
            show: true,
            backdrop: 'static'
        });
    },
    'submit form': function (evt, tmpl) {
        evt.preventDefault();
        evt.stopPropagation();
        var updateThis = {$set: {
            'address.line1':          $('#line1').val(),
            'address.line2':          $('#line2').val(),
            'address.city':           $('#city').val(),
            'address.state':          $('#state').val(),
            'address.postal_code':    $('#postal_code').val(),
            phone:                    $('#phone').val()
        }};
        console.log("worked");

        var updateCustomer = Customers.update(Customers.findOne()._id, updateThis);
        if(updateCustomer === 1) {
            $('#modal_for_address_change').modal('hide')
        }

    }
});

Template.UserProfile.rendered = function(){
   Session.set("showHistory", false);

    // Setup parsley form validation
    $('#userAddressForm').parsley();
};
