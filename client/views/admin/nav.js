Template.Nav.helpers({
    signInOut: function(){
        var key = Meteor.user() ? 'signOut' : 'signIn';
        return T9n.get(key);
    }
});

Template.Nav.events({
    'click #nav-signinout': function(event){
        if (Meteor.user())
            Meteor.logout();
        else
            Router.go('atSignIn');
    },
});

/*Template.AdminNavBar.events({
	'submit form': function(e, tmpl) {
		//prevent the default reaction to submitting this form
                e.preventDefault();
                // Stop propagation prevents the form from being submitted more than once.
                e.stopPropagation();

                console.log($('#admin_search').val());
                Meteor.call('admin_search', $('#admin_search').val(), function (error, result) {
                	result ? console.log(result): console.log(error);
                });

	} 
});*/