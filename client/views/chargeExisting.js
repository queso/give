Template.ChargeExisting.events({
    'submit form': function (events, tmpl) {
        events.preventDefault();

        var data = {
            href:           $(events.target).find('[name=href]').val(),
            total_amount:   107,
            description: "Test Direct Card"
        };
        console.log(data);

        Meteor.call("chargeExistingCard", data, function(error, result) {
            console.dir(error+result);
            console.log("Error: " + error + "  Result: " + JSON.stringify(result, false, 4)); 

        });
    }
});
