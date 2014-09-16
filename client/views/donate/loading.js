Template.Loading.rendered = function() {
    $('#loading1').modal('show');
}
Template.Loading.destroyed = function() {
    $('#loading1').modal('hide');
}