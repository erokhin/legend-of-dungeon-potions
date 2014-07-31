$(document).ready(function () {

    var retrieveValueFromCookie = function (element) {
        var currentCookie = $.cookie(String(element.name));
        if (typeof(currentCookie) === "undefined") {
            currentCookie = "no-effect";
        }
        $(element).val(currentCookie);
    };

    var retrieveAllValuesFromCookie = function () {
        $("input").each(function () {
            retrieveValueFromCookie(this);
        });
    };

    var setInputDescription = function (element) {
        var $previousEffect = $(element).siblings(".potion-effect");
        if ($previousEffect.length > 0) {
            $("#dropdown").find("*[data-value='" + $previousEffect.data("value") + "']").show();
            $previousEffect.remove();
        }

        // if ($(element).val() == "no-effect") {
        //     return;
        // }

        var $clonedElement = $("#dropdown").find("*[data-value='" + $(element).val() + "']").clone();
        $(element).parent().append($clonedElement);
        $("#dropdown").find("*[data-value='" + $(element).val() + "']").hide();
    };

    var setAllDescriptions = function () {
        $("input").each(function () {
            setInputDescription(this);
        });
    };

    // Reset button
    $("#reset").click(function () {
        var isReset = confirm("Are you sure?");
        if (isReset == true) {
            $("input").each(function () {
                $(this).val("no-effect").trigger("change");
            });
            setAllDescriptions();
        }
    });

    // OnLoad setting the value from the cookie...
    retrieveAllValuesFromCookie();

    // ... and setting the descriptions
    setAllDescriptions();
    
    // On every change of the select
    $("input").change(function(){
        $.cookie(String(this.name), String(this.value));
        var currentCookie = $.cookie(this.name);
        setInputDescription(this);
    });

    $("ul.potions").quickDropdown({
        $dropdownContainers: $("#dropdown"),
            showOnCLick: true,
            willShowDropdown: function (e) {
                var $clickTarget = $(e.target);
                var $clickedLi;
                var liFound = false;
                $(".potions li").each(function () {
                    var $currentLi = $(this);
                    if (!liFound && $clickTarget.parents().andSelf().is($currentLi)) {
                        $clickedLi = $currentLi;
                        liFound = true;
                    }
                });
                $("#dropdown").css({top: $clickedLi.offset().top + $clickedLi.outerHeight()});
                $clickedLi.addClass("selected");
                var newScrollTop = $clickedLi.offset().top;
                $("html, body").animate(
                    {scrollTop: newScrollTop}
                );
                return true;
            },
        willHideDropdown: function () {
            $(".potions li").removeClass("selected");
            return true;
        }
    });

    $("#dropdown div").click(function () {
        var newScrollTop = $("ul.potions li.selected").offset().top;
        $("html, body").animate(
            { scrollTop: newScrollTop }
        );
        $("ul.potions li.selected input").val($(this).data("value")).trigger("change");
        QUICK_DROPDOWN_BUTTONS.hideAllDropdowns();
    });
});
