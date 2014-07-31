/* ************************************************************************* */
/* JQUERY
 * ************************************************************************* */
;
// Element functions extensions
jQuery.fn.extend({
    // Disable the selection for the element
    disableSelection: function() {
        return this
            .attr("unselectable", "on")
            .css("user-select", "none")
            .on("selectstart", false);
    },
    // Check if the element has at least one parent with the given selector
    hasParents: function(parents) {
        return this.parents(parents).length > 0;
    },
    // Check if the element has at least one parent with the given jQuery object
    has$Parents: function ($parents) {
        return this.parents().filter($parents).length > 0;
    },
    isOrHas$Parents: function($parents) {
        return this.is($parents) || this.has$Parents($parents);
    }
});

/* ************************************************************************* */
/* NOT JQUERY
 * ************************************************************************* */

// Modernizr "touch" check + IE10 touch check
// Fixing the check with this solution (for IE10): http://stackoverflow.com/a/13470899
if (
    ('ontouchstart' in window) || (navigator.msMaxTouchPoints) 
    || window.DocumentTouch && document instanceof DocumentTouch) {

    $("html").addClass("touch");
}

;
