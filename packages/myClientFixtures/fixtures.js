Meteor.startup(function() {
  Stripe = {};

  Stripe.card = {};

  Stripe.card.createToken = function(cardObject, callback) {
    response = {
      "id": "tok_15kbwc4NP2bNLNg5AGLUoLew",
      "livemode": false,
      "created": 1427380010,
      "used": false,
      "object": "token",
      "type": "card",
      "card": {
        "id": "card_15kbwc4NP2bNLNg5shTqffxp",
        "object": "card",
        "last4": "4242",
        "brand": "Visa",
        "funding": "credit",
        "exp_month": 12,
        "exp_year": 2015,
        "country": "US",
        "name": "Joe Sixpack",
        "address_line1": "Address Line 1",
        "address_line2": "Address Line 2",
        "address_city": "Topeka",
        "address_state": "KS",
        "address_zip": "66618",
        "address_country": "US",
        "cvc_check": "unchecked",
        "address_line1_check": "unchecked",
        "address_zip_check": "unchecked",
        "dynamic_last4": null
      },
      "client_ip": "74.83.14.54"
    };
    status = 200;
    callback(status, response);
  };


});
