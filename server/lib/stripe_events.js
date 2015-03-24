Stripe_Events = {
    'account.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'account.application.deauthorized': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'application_fee.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'application_fee.refunded': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'balance.available': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'charge.pending': function (stripeEvent, res) {
        Utils.charge_events(stripeEvent);
        if(stripeEvent.data.object.amount === 0)
        Utils.audit_dt_donation(stripeEvent.data.object.id, stripeEvent.data.object.customer);
        return;
    },
    'charge.succeeded': function (stripeEvent, res) {
        Utils.charge_events(stripeEvent);
        Utils.audit_dt_donation(stripeEvent.data.object.id, stripeEvent.data.object.customer);
        return;
    },
    'charge.failed': function (stripeEvent, res) {
        Utils.charge_events(stripeEvent);
        Utils.audit_dt_donation(stripeEvent.data.object.id, stripeEvent.data.object.customer);
        return;
    },
    'charge.refunded': function (stripeEvent, res) {
        Utils.charge_events(stripeEvent);
        Utils.audit_dt_donation(stripeEvent.data.object.id, stripeEvent.data.object.customer);
        return;
    },
    'charge.captured': function (stripeEvent, res) {
        Utils.charge_events(stripeEvent);
        return;
    },
    'charge.updated': function (stripeEvent, res) {
        Utils.charge_events(stripeEvent);
        return;
    },
    'charge.dispute.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'charge.dispute.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'charge.dispute.closed': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.created': function (stripeEvent, res) {
        var sync_request = Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.updated': function (stripeEvent, res) {
        var sync_request = Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.card.created': function (stripeEvent, res) {
        Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.card.updated': function (stripeEvent, res) {
        Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.card.deleted': function (stripeEvent, res) {
        Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.source.created': function (stripeEvent, res) {
        Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.subscription.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.subscription.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.subscription.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.subscription.trial_will_end': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.discount.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.discount.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'customer.discount.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoice.created': function (stripeEvent, res) {
        Utils.store_stripe_event(stripeEvent);
        Utils.add_meta_from_subscription_to_charge(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoice.updated': function (stripeEvent, res) {
        Utils.store_stripe_event(stripeEvent);

        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoice.payment_succeeded': function (stripeEvent, res) {
        var sync_request = Utils.store_stripe_event(stripeEvent);
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoice.payment_failed ': function (stripeEvent, res) {
        var sync_request = Utils.store_stripe_event(stripeEvent);
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoiceitem.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoiceitem.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'invoiceitem.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'plan.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        Meteor.setTimeout(function(){
            console.dir(stripeEvent);
        }, 3000);
        return;
    },
    'plan.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'plan.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'coupon.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'coupon.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'recipient.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'recipient.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'recipient.deleted': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'transfer.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'transfer.updated': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'transfer.paid': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'transfer.failed': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'bitcoin.receiver.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'bitcoin.receiver.transaction.created': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'bitcoin.receiver.filled': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    },
    'ping': function (stripeEvent, res) {
        console.log(stripeEvent.type + ': event processed');
        return;
    }
};