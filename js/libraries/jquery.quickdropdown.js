// Dependences:
// - jQuery
// - jQuery virtualmouse for "vclick" event
// - jQuery Shiny Frog add-ons (test for touch, etc)
//
// Result:
// The plugin will add the class options.selectedClass to the $dropdownButton and the $dropdownContainers on mouse hover or
// mobile tap.
// Other characteristics:
//  - it handles the hide timeout on desktop
//  - it hides the other dropdowns when a dropdown is opened
//  - it hides the dropdown when $(document) is tapped
//
// Usage:
// $(<dropdown activation button>).quickDropdown($(<dropdown external containers>))
//   * The dropdown external container is useful only if the element to show on
//     button's hover is outside the button.
//   * If the element to show is inside the button use CSS to show the element
//   * When using the external container be sure to provide a *unique* selector
//     to prevent unexpected behaviours
// $(<elements occasionally .selected>).quickDropdownShallHideOnDropdown()
//   * The class options.selectedClass will be removed from these elements when a dropdown is made
//     visible or a $(document).click() is performed

;

(function($) {

    // Used to collect elements to be hidden after every dropdown is opened
    $.fn.quickDropdownShallHideOnDropdown = function () {
        // return this.each(function () {
            QUICK_DROPDOWN_BUTTONS.add(this);
        // });
    };

    $.fn.quickDropdownForwardButton = function($toButton) {

        var quickDropdownForwardEvent = function (e) {
            $toButton.trigger(e.type);
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        };

        return this.each(function() {
            $dropdownButton = $(this);

            // Activating the virtualMouse events (vclick) on the button
            $dropdownButton.virtualMouse();

            // All the handled events
            var eventsToBind = $._data($toButton[0], "events");
            for (var currentEventType in eventsToBind) {
                var currentEvent = eventsToBind[currentEventType];
                if (currentEvent[0].namespace === "quickDropdown") {
                    var currentEventType = currentEvent[0].type + "." + currentEvent[0].namespace;
                    $dropdownButton.on(currentEventType, quickDropdownForwardEvent);
                }
            }
        });
    }

    $.fn.quickDropdown = function(options) {

        // Function used as default callback
        var returnTrue = function () {
            return true;
        };

        // Handling options
        var options = options || {};
        var defaults = {
            $dropdownContainers: $(),                       // Linked containers to apply the options.selectedClass class on
            selectedClass: "quick-dropdown-selected",       // Class to apply to the selected dropdown's button and containers
            unselectedClass: "quick-dropdown-unselected",   // Class to apply to the unselected dropdown's (that was selected at least one time) button and containers
            disableCSSSelectionOnButton: true,              // Disables the mouse selection on the button of the dropdown
            autoHiding: true,                               // Disable autohiding for hover activated dropdowns
            hideDelay: 0,                                   // Delay applied only on desktop hover
            showOnCLick: false,                             // Shows only on click (not on hover)
            hideOnClick: true,                              // Hides the dropdown when clicking again on an opened button
            hideOthers: true,                               // Hide other dropdowns when opening a new one
            hideOnlyWithSameClass: false,                   // Hide only those dropdowns that have the same selectedClass as the one is closed
            willShowDropdown: returnTrue,                   // Boolean callback function to execute before showing the dropdown (if the function returns false the dropdown is not shown)
            didShowDropdown: function () {},                // Callback function to execute after showing the dropdown
            willHideDropdown: returnTrue,                   // Boolean callback function to execute befote hiding the dropdown (if the function returns false the dropdown is not hidden)
            didHideDropdown: function () {}                 // Callback function to execute after hiding the dropdown
        };
        options = $.extend(defaults, options);

        return this.each(function() {
            var dropdownSelectionToggler = function (e) {

                // Debug
                // console.log("-- Dropdown click (dropdown plugin)", e.target, e.type, e);

                // Maintaining the link default behavior i.e. the double tap on mobile and link following
                if ((e.type == "vclick" || e.type == "click") && ($(e.target).is("a") || $(e.target).hasParents("a"))) {
                    return;
                }

                // Stopping the propagation of the click to prevent the click event on the document
                if (e.type == "vclick" || e.type == "click") {
                    e.stopPropagation();
                    e.preventDefault();
                }

                var $dropdownButton;

                if ($.type($(this).data("quick-dropdown-options")) !== "undefined") {
                    $dropdownButton = $(this);
                } else {
                    $dropdownButton = $(this).data("quick-dropdown-button");
                }

                if (e.type == "mouseenter" && $dropdownButton.hasClass(options.selectedClass)) {
                    if (options.hideDelay > 0) {
                        var hideTimeout = $dropdownButton.data("quick-dropdown-hide-timeout");
                        window.clearTimeout(hideTimeout);
                    }
                    return;
                }

                if (e.type == "mouseleave" && !$dropdownButton.hasClass(options.selectedClass)) {
                    return;
                }

                var handyEventType = e.type;
                if (e.type == "vclick" || e.type == "click") {
                    // We'll translate the tap events into mouse events
                    // (mouse events have the button attribute set)
                    if ($dropdownButton.hasClass(options.selectedClass)) {
                        handyEventType = "mouseleave";
                    }
                    else {
                        handyEventType = "mouseenter";
                    }
                }

                // Adding options.selectedClass class to the current button
                if (handyEventType == "mouseenter") {
                    QUICK_DROPDOWN_BUTTONS.showDropdown($dropdownButton, e);
                } else if (handyEventType == "mouseleave" && options.hideOnClick) {
                    if (options.hideDelay > 0 && e.type != "vclick") {
                        
                        // Delay only on desktop browsers (it is not a tap event)
                        var hideTimeout = window.setTimeout(
                            function () {
                                QUICK_DROPDOWN_BUTTONS.hideDropdown($dropdownButton);
                            }, options.hideDelay);

                        $dropdownButton.data("quick-dropdown-hide-timeout", hideTimeout)
                    }
                    else {
                        // Not setting a timeout with 0 seconds to preserve the synchronousness
                        QUICK_DROPDOWN_BUTTONS.hideDropdown($dropdownButton);
                    }
                }

                if (options.hideOthers) {
                    // Removing the options.selectedClass class from all the dropdown that are not the current one
                    QUICK_DROPDOWN_BUTTONS.hideAllDropdownsExcept($dropdownButton, options.hideOnlyWithSameClass);
                }
            };

            var $dropdownButton = $(this);

            if ($dropdownButton.data("quick-dropdown-containers")) {
                console.warn(" --- [SF] QuickDropdown: the button ", $dropdownButton, "already has assocciated dropdown containers (", $dropdownButton.data("quick-dropdown-containers"), "). The dropdown was not created.");
                return;
            }

            if (options.$dropdownContainers.data("quick-dropdown-button")) {
                console.warn(" --- [SF] QuickDropdown: one or more of the containers ", options.$dropdownContainers, "already has assocciated dropdown buttons (", options.$dropdownContainers.data("quick-dropdown-button"), "). The dropdown was not created.");
                return;
            }

            if (options.disableSelectionOnButton) {
                $dropdownButton.disableSelection();
            }
            
            $dropdownButton.data("quick-dropdown-containers", options.$dropdownContainers);
            $dropdownButton.data("qdSelectedClass", options.selectedClass);
            $dropdownButton.data("quick-dropdown-options", options);

            options.$dropdownContainers.data("quick-dropdown-button", $dropdownButton);

            // console.log("---------------------------");
            // console.log("CONTAINERS : ", options.$dropdownContainers);

            $dropdownButton.quickDropdownShallHideOnDropdown();

            if (options.disableCSSSelectionOnButton) {
                $dropdownButton.disableSelection(); // SF Addon (jquery.addons.js)
            }

            if ($("html").is(".touch")) {
                // Activating the virtualMouse events (vclick) on the button
                $dropdownButton.virtualMouse();
                // vclick bindings - mobile device taps
                $dropdownButton.on("vclick.quickDropdown", dropdownSelectionToggler);
            } else {

                if (options.showOnCLick) {
                    $dropdownButton.on("click.quickDropdown", dropdownSelectionToggler);
                }
                else {
                    // hover bindings - desktop mouseenter and mouseleave
                    $dropdownButton.on("mouseenter.quickDropdown", dropdownSelectionToggler);
                    options.$dropdownContainers.on("mouseenter.quickDropdown", dropdownSelectionToggler);

                    if (options.autoHiding) {
                        $dropdownButton.on("mouseleave.quickDropdown", dropdownSelectionToggler);
                        options.$dropdownContainers.on("mouseleave.quickDropdown", dropdownSelectionToggler);
                    }
                }
            }
        });
    };
}(jQuery));




/* ************************************************************************* **
 * Class that handles the dropdown buttons de-selection
 * ************************************************************************* */

var QuickDropdownButtonsHandler = function () {

    this.add = function ($button) {
        this._$quickDropdownButtons = this._$quickDropdownButtons.add($button);
    };

    this.hideDropdown = function ($dropdownButton) {

        var $dropdownContainers = $dropdownButton.data("quick-dropdown-containers");
        var options = $dropdownButton.data("quick-dropdown-options");

        if (!$dropdownContainers.hasClass(options.selectedClass)) {
            return;
        }

        if (!options.willHideDropdown()) {
            console.warn(" --- [SF] QuickDropdown: The dropdown was not hidden because the callback function returned false.");
            return;
        }

        $dropdownButton.addClass(options.unselectedClass);
        $dropdownContainers.addClass(options.unselectedClass);

        $dropdownButton.removeClass(options.selectedClass);
        $dropdownContainers.removeClass(options.selectedClass);
        
        options.didHideDropdown();

        // console.log(" -- removing .selected to ", $dropdownButton, " (button) and to ", $dropdownContainers, " (container)");
    };

    this.hideAllDropdowns = function () {
        this.hideAllDropdownsExcept($(), false);
    };

    this.hideAllDropdownsExcept = function ($exceptDropdownButton, hideOnlyWithSameClass) {

        var $dropdownsToHide = this._$quickDropdownButtons.not($exceptDropdownButton);

        if (hideOnlyWithSameClass) {
            var theSameClass = $exceptDropdownButton.data("qdSelectedClass");
            $dropdownsToHide = $dropdownsToHide.filter("." + theSameClass);
        }

        $dropdownsToHide.each(function () {
            QUICK_DROPDOWN_BUTTONS.hideDropdown($(this));
        });
    };

    this.showDropdown = function ($dropdownButton, e) {

        var $dropdownContainers = $dropdownButton.data("quick-dropdown-containers");
        var options = $dropdownButton.data("quick-dropdown-options");

        if ($dropdownContainers.hasClass(options.selectedClass)) {
            return;
        }

        if (options.hideDelay > 0) {
            var hideTimeout = $dropdownButton.data("quick-dropdown-hide-timeout");
            window.clearTimeout(hideTimeout);
        }
        
        if (!options.willShowDropdown(e)) {
            console.warn(" --- [SF] QuickDropdown: The dropdown was not shown because the callback function returned false.");
            return;
        }
        
        $dropdownButton.addClass(options.selectedClass);
        $dropdownContainers.addClass(options.selectedClass);

        $dropdownButton.removeClass(options.unselectedClass);
        $dropdownContainers.removeClass(options.unselectedClass);

        options.didShowDropdown(e);

        // console.log(" -- adding .selected to ", $dropdownButton, " (button) and to ", $dropdownContainers, " (container)");
    };

    this.$openedButtonsAndContainers = function () {
        var $openedButtonsAndContainers = $();
        for (buttonIndex in this._$quickDropdownButtons.toArray()) {
            var $button = $(this._$quickDropdownButtons[buttonIndex]);
            if ($button.hasClass($button.data("qdSelectedClass"))) {
                $openedButtonsAndContainers = $openedButtonsAndContainers.add($button);
                $openedButtonsAndContainers = $openedButtonsAndContainers.add($button.data("quick-dropdown-containers"));
            }
        }
        return $openedButtonsAndContainers;
    };

    this.hasElementInsideTheOpenedDropdown = function ($element) {
        return $element.isOrHas$Parents(this.$openedButtonsAndContainers());
    };

    // Private attributes - not use 'em :)
    this._$quickDropdownButtons = $();
};
var QUICK_DROPDOWN_BUTTONS = new QuickDropdownButtonsHandler();




/* ************************************************************************* **
 * Removing the selected classes from all the dropdown buttons on outside click
 * ************************************************************************* */

$(document).ready(function () {
    // Activating virtualMouse events (vclick) on document
    $(document).virtualMouse();
    // Hiding all the quick dropdowns on click on the document background
    $(document).on("vclick.quickDropdown click.quickDropdown", function (e) {
        // console.log("-- Document click (dropdown plugin)"); // Debug

        // We don't want to stop the link click propagation. I think the click is prevented
        // because the tapend event is shot on a hidden link.
        if (QUICK_DROPDOWN_BUTTONS.hasElementInsideTheOpenedDropdown($(e.target))) {
            return;
        }

        QUICK_DROPDOWN_BUTTONS.hideAllDropdowns();
    }); 
});
