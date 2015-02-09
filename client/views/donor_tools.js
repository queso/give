function output(inp) {
    document.body.appendChild(document.createElement('pre')).innerHTML = inp;
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

Template.DonorToolsPerson.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        console.log($('#person_id').val());
        var id = $('#person_id').val();
        Meteor.call("get_dt", id, ".json", function (error, result) {
            if (result) {
                console.dir(result.data.persona);
                $('pre').remove();

                var str = JSON.stringify(result.data.persona, undefined, 4);
                output(syntaxHighlight(str));
/*
                $('#data').append(syntaxHighlight());
                $('#form_result').show();*/

            } else {
                console.log(error);
            }
        });
    }
});

Template.DTInsertPersona.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        console.log($('#persona_id').val());
        var id = $('#id').val();
        var persona_id = $('#persona_id').val();
        Meteor.call("insert_dt_persona", id, persona_id, function (error, result) {
            if (result) {

                 $('#data').append(result);
                 $('#form_result').show();

            } else {
                console.log(error);
            }
        });
    }
});

Template.DTInsertPersona.helpers({
    id: function() {
        return Session.get('params.id');
    },
    persona_id: function() {
        return Session.get('params.persona_id');
    }
})

Template.DonorToolsSearch.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        console.log($('#search_string').val());
        var search_string = $('#search_string').val();
        Meteor.call("get_dt_id", search_string, function (error, result) {
            if (result) {
                console.dir(result);
                 $('#data').html('<div class="col-lg-6 text-center"><br><p>' + result+ '</p></div>');
                 $('#form_result').show();

            } else {
                console.log(error);
            }
        });
    }
});

Template.DonorToolsSearch.helpers({
    email: function() {
        if(Session.get('params.email')){
            return Session.get('params.email');
        } else
            return 'josh@trashmountain.com';
    }
});

Template.DonorToolsInsertAccount.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        console.log($('#user_id').val());
        var id = $('#user_id').val();
        Meteor.call("insert_user_into_dt", id, function (error, result) {
            if (result) {
                console.dir(result);
                $('#data').html('<div class="col-lg-6 text-center"><br><p>' + result+ '</p></div>');
                $('#form_result').show();

            } else {
                console.log(error);
            }
        });
    }
});

Template.DonorToolsInsertAccount.helpers({
    id: function() {
        if(Session.get('params.id')){
            return Session.get('params.id');
        }
    }
});

Template.DonorToolsInsertAccountAndDonation.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        console.log($('#donation_id').val());
        var donation_id = $('#donation_id').val();
        Meteor.call("insert_donation_into_dt", donation_id, function (error, result) {
            if (result) {
                console.dir(result);
                $('#data').html('<div class="col-lg-6 text-center"><br><p><a target="_blank" href="' + 'https://trashmountain.donortools.com/people/' + result.data.donation.persona_id + '">Result</a></p></div>');
                $('#form_result').show();

            } else {
                console.log(error);
            }
        });
    }
});

Template.DonorToolsInsertAccountAndDonation.helpers({
    donation_id: function() {
        if(Session.get('params.donation_id')){
            return Session.get('params.donation_id');
        }
    }
});

Template.DonorToolsFunds.events({
    'submit form': function(e) {
        //prevent the default reaction to submitting this form
        e.preventDefault();
        // Stop propagation prevents the form from being submitted more than once.
        e.stopPropagation();

        Meteor.call("get_dt_funds", function (error, result) {
            if (result) {
                console.dir(result);
                $('#data').html('<div class="col-lg-6 text-center"><br><p>' + result+ '</p></div>');
                $('#form_result').show();

            } else {
                console.log(error);
            }
        });
    }
});
