(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  /**
   * allow width to be flexible
   * initially created fof coupons bottom panel
   */
  myModule.directive('gsnFlexibleWidth', ['debounce', '$window', function (debounce, $window) {
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      function updateWidth() {
        element.css({
          width: element.parent()[0].offsetWidth + 'px'
        });
      }

      var myUpdateWith = debounce(updateWidth, 200);
      angular.element($window).on('resize', myUpdateWith);
      myUpdateWith();
    }
  }]);
})(angular);
