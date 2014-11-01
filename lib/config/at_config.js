AccountsTemplates.configure({
    forbidClientAccountCreation: true
});

AccountsTemplates.configureRoute('signIn', {
    name: 'Login',
    redirect: '/give/dashboard'
});

Meteor.startup(function(){
	AccountsTemplates.init();
});