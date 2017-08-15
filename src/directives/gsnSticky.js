(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnSticky', ['$window', '$timeout', 'debounce', function($window, $timeout, debounce) {

    var directive = {
      link: link,
      restrict: 'A',
    };
    return directive;

    function link(scope, element, attrs) {
      var anchor = angular.element('<div class="sticky-anchor"></div>');
      element.before(anchor);
      element.css({
        bottom: 'auto',
        top: 'auto'
      });

      function checkSticky() {
        var scrollTop = angular.element($window).scrollTop();
        var screenHeight = angular.element($window).height();
        var anchorTop = anchor.offset().top;
        var elementHeight = element.height();
        var top = parseInt(attrs.top) || 0;
        var bottom = parseInt(attrs.bottom);
        var isStuck = false;


        if (!isNaN(bottom)) {
          // only sticky to bottom if scroll beyond anchor or it's beyound bottom of screen
          isStuck = (scrollTop > anchorTop + elementHeight) || (scrollTop + screenHeight < anchorTop + bottom);
          if (isStuck) {
            element.css({
              bottom: bottom,
              top: 'auto'
            });
          }
        } else if (!isNaN(top)) {
          isStuck = scrollTop > anchorTop + top + elementHeight;
          if (isStuck) {
            element.css({
              bottom: 'auto',
              top: top
            });
          }
        }

        // if screen is too small, don't do sticky
        if (screenHeight < (top + (bottom || 0) + elementHeight)) {
          isStuck = false;
        }

        if (isStuck) {
          element.addClass('stuck');
        } else {
          element.css({
            bottom: 'auto',
            top: 'auto'
          });
          element.removeClass('stuck');
        }

        // probagate
        return true;
      }

      var myCheckSticky = debounce(checkSticky, 200);

      angular.element($window).on('scroll', myCheckSticky);
      scope.$watch(attrs.reloadOnChange, myCheckSticky);
    }
  }]);
})(angular);
