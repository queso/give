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
    // use the primary_customer_id to find all of the info to insert here
    if(Meteor.user() && context === 'line1'){
        return "line1";
    }
});
