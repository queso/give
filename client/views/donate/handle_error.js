handleError = function (data) {
	//remove below before production 
	console.log(data);
	console.log("Error message: " + error.message);
	console.log(error);
	var errorCode = error.error;
	var errorDescription = error.description;
	//remove below before production 
	console.log("description: " + error.description);
	switch (errorCode) {
	  case "card-declined":
	      //var sendToErrorFunction = cardDeclined();
	      //remove below before production 
	      console.log("Card was declined");
	      //use this area to add the error to the errors collection,
	      //also, send an email to me with the error printed in it
	      //don't need to use mandrill for this (unless that would be 
	      //easier
	      break;
	  case "account-insufficient-funds":
	      //var sendToErrorFunction = accountInsufficientFunds();
	      break;
	  case "authorization-failed":
	      //var sendToErrorFunction = authorizationFailed();
	      break;
	  case "address-verification-failed":
	      //var sendToErrorFunction = addressVerificationFailed();
	      break;
	  case "bank-account-not-valid":
	      //var sendToErrorFunction = bankAccountNotValid();
	      break;
	  case "card-not-valid":
	  //remove below before production 
	      console.log(error.details);
	      //var sendToErrorFunction = cardNotValid();
	      break;
	  case "card-not-validated":
	      //this is the error for a card that is to short, probably for other errors too
	      //remove below before production 
	      console.log(error.details);
	      //var sendToErrorFunction = cardNotValidated();
	      break;
	  case "insufficient-funds":
	      //var sendToErrorFunction = insufficientFunds();
	      break;
	  case "multiple-debits":
	      //var sendToErrorFunction = multipleDebits();
	      break;
	  case "no-funding-destination":
	      //var sendToErrorFunction = noFundingDestination();
	      break;
	  case "no-funding-source":
	      break;
	  case "unexpected-payload":
	      break;
	  case "bank-account-authentication-forbidden":
	      break;
	  case "incomplete-account-info":
	      break;
	  case "invalid-amount":
	  	alert((error.details));
	      break;
	  case "invalid-bank-account-number":
	      break;
	  case "invalid-routing-number":
	      break;
	  case "not-found":
	      break;
	  case "request":
	  //remove below before production 
	      console.log(error.details);
	      break;
	  case "method-not-allowed":
	      break;
	  case "amount-exceeds-limit":
	      //use this area to split payment into more than one
	      //then send the multiple payments through, 
	      //or for a temporary workaround print instructions
	      //back to the user, tell them the max and how they can
	      //debit more in sepearte transactions
	      break;
	  default:
	  //remove below before production 
	      console.log("Didn't match any case");
	      //var sendToErrorFunction = "No Match";
	      break;
	}
	//END Switch case block

	$('#loading1').modal('hide');
	}
	//END error handling block for meteor call to processPayment