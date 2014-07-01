Template.Thanks.helpers({
});

Template.Thanks.rendered = function () {
	// Scroll to top of the parent window
	if (!self == top){
		window.parent.ScrollToTop(); 
	}
};