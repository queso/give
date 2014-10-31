AccountsTemplates.configureRoute('signIn', {
    redirect: '/give/dashboard'
});

Meteor.startup(function(){
	AccountsTemplates.init();
});