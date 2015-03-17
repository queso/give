stripeUpdateSubscription = function(request){
    var getUser = Meteor.users.findOne({"customerId": request.customer}, {fields: {"_id": 1}});

    if (getUser){
        var update = {
            auth: SERVER_AUTH_TOKEN,
            user: getUser._id,
            subscription: {
                status: request.cancel_at_period_end ? "canceled" : request.status,
                ends: request.current_period_end
            }
        }

        Meteor.call('updateUserSubscription', update, function(error, response){
            if (error){
                console.log(error);
            }
        });
    }
}
