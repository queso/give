AccountsTemplates.configure({
    forbidClientAccountCreation: true
});

AccountsTemplates.configureRoute('signIn', {
    name: 'Login',
    redirect: '/give/dashboard'
});

AccountsTemplates.configureRoute('enrollAccount', {
    name: 'enrollAccount',
    path: '/give/enroll-account',
    template: 'fullPageAtForm',
    redirect: '/give/user-profile'
});