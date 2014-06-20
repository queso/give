var validator = new FormValidator('donation_form', [{
    name: 'fname',
    display: 'required',    
    rules: 'required'
}, {
    name: 'alphanumeric',
    rules: 'alpha_numeric'
}, {
    name: 'password',
    rules: 'required'
}, {
    name: 'password_confirm',
    display: 'password confirmation',
    rules: 'required|matches[password]'
}, {
    name: 'email',
    rules: 'valid_email',
    depends: function() {
        return Math.random() > .5;
    }
}, {
    name: 'routing_number',
    display: 'min length',
    rules: 'min_length[9]'
}], function(errors, event) {
    if (errors.length > 0) {
        // Show the errors
    }
});