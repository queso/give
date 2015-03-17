/*
Event_types = {
	*/
/*************************************************************//*

    */
/***************         DEBIT AREA             **************//*

    */
/*************************************************************//*

    debit_created: function (billy, id) {
        logger.info("Got to the debit_created");
        */
/*if(billy){
            Evts.update_billy(body.events[0].entity.debits[0].id, body.events[0].entity.debits[0].status);
            Evts.send_received_email(body.events[0].entity.debits[0].id, body.events[0].entity.debits[0].status);
        } else{
            this.emit('update_from_event', body.events[0].entity.debits[0].id,
            body.events[0].entity.debits[0].status);
            this.emit('send_received_email', body.events[0].entity.debits[0].id, body.events[0].entity.debits[0].status);
        }*//*

        return "test";
    }, 
    debit_succeeded: function (billy, id) {
        logger.info("Got to the debit_succeeded");
    },
    debit_failed: function (billy, id) {
        logger.info("Got to the debit_failed");
        */
/*if(billy){
            this.emit('update_billy', body.events[0].entity.debits[0].id,
            body.events[0].entity.debits[0].status);
        } else{
            this.emit('update_from_event', body.events[0].entity.debits[0].id,
            body.events[0].entity.debits[0].status);
        }
        this.emit('failed_collection_update', 'debits', body.events[0].entity.debits[0].id);
        this.emit('send_email', body.events[0].entity.debits[0].id, 'failed');*//*

    }, 
    */
/*************************************************************//*

    */
/***************         END DEBIT AREA         **************//*

    */
/*************************************************************//*


    */
/*************************************************************//*

    */
/***************         Hold AREA             **************//*

    */
/*************************************************************//*

    //TODO: Need to send these to a special event that adds these to the database. Look below for a link to an example.
    //https://www.runscope.com/share/kqnnt5wx1akd/970ea5ab-ea91-476e-9fe3-6a97f272c519
    */
/*hold_created: function () {
        logger.info("Got to hold_created");
    }, 
    hold_updated: function () {
        logger.info("Got to hold_updated");
    }, 
    hold_captured: function () {
        logger.info("Got to hold_captured");
    }, *//*

    */
/*************************************************************//*

    */
/***************         END HOLDS AREA         **************//*

    */
/*************************************************************//*


    */
/*************************************************************//*

    */
/***************         ACCOUNTS AREA         ***************//*

    */
/*************************************************************//*

    //TODO: Need to send these to a special event that adds these to the database. Look below for a link to an example.
    //https://www.runscope.com/share/kqnnt5wx1akd/aed288ff-a1f3-49a0-8dc5-37bc2b3102a9
    */
/*card_updated: function () {
        logger.info("Got to the card_updated");
    }, 
    card_created: function () {
        logger.info("Got to the card_updated");
    }, 
    account_created: function () {
        logger.info("Got to the account_created");
    },
    bank_account_updated: function () {
        logger.info("Got to the bank_account_updated");
    }, 
    bank_account_created: function () {
        logger.info("Got to the card_updated");
    }, *//*

    */
/*************************************************************//*

    */
/**************         END ACCOUNTS AREA         ************//*

    */
/*************************************************************//*


    */
/*************************************************************//*

    */
/***************         INVOICES AREA         ***************//*

    */
/*************************************************************//*

    invoice_created: function () {
        logger.info("Got to the invoice_created");
        id = Invoices.insert(body.events[0].entity.invoices[0]);
        logger.info("ID: " + id);
    }, 
    invoice_updated: function () {
        logger.info("Got to the invoice_updated");
        var insertThis = body.events[0].entity.invoices[0].state;
        Invoices.update({id: body.events[0].entity.invoices[0].id}, 
        { $set: { state: insertThis}
        });
    }, 
    fee_settlement_created: function () {
        logger.info("Got to the fee_settlement_created");
    }, 
    fee_settlement_updated: function () {
        logger.info("Got to the fee_settlement_updated");
    }
    */
/*************************************************************//*

    */
/************         END INVOICES AREA         **************//*

    */
/*************************************************************//*

};*/
