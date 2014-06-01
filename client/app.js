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

Meteor.subscribe('Donate');