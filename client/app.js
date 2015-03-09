/*****************************************************************************/
/* Client App Namespace  */
/*****************************************************************************/
_.extend(App, {
});

App.helpers = {
};

_.each(App.helpers, function (helper, key) {
  UI.registerHelper(key, helper);
});

UI.registerHelper('formatTime', function(context, options) {
  if(context)
    return moment(context).format('MM/DD/YYYY, hh:mm');
});

UI.registerHelper('shortIt', function(stringToShorten, maxCharsAmount){
  if(stringToShorten.length <= maxCharsAmount){
    return stringToShorten;
  }
  return stringToShorten.substring(0, maxCharsAmount);
});

UI.registerHelper('twoDecimalPlaces', function(stringToAddDecimal){
  return parseFloat(Math.round(stringToAddDecimal) / 100).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
});

UI.registerHelper('formatDate', function(context, options) {
    if(context)
        return moment(context).format('MMM DD, YYYY');
});

UI.registerHelper('logged_in', function(context) {
    if(Meteor.user()){
        switch(context){
            case "fname":
                return Meteor.user().profile.fname;
                break;
            case "lname":
                return Meteor.user().profile.lname;
                break;
            case "email":
                return Meteor.user().emails[0].address;
                break;
            case "line1":
                return Meteor.user().profile.address.line1;
                break;
            case "line2":
                return Meteor.user().profile.address.line2;
                break;
            case "city":
                return Meteor.user().profile.address.city;
                break;
            case "state":
                return Meteor.user().profile.address.state;
                break;
            case "postal_code":
                return Meteor.user().profile.address.postal_code;
                break;
            case "phone":
                return Meteor.user().profile.phone;
                break;
            case "business_name":
                if(Meteor.user().profile.business_name){
                    return  Meteor.user().profile.business_name;
                }
                break;
            default:
                return;
        }
    }
    else{
        return;
    }
});
