(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnHoverSync', ['$window', '$timeout', 'debounce', function($window, $timeout, debounce) {

    var directive = {
      link: link,
      restrict: 'A',
    };
    return directive;

    function link(scope, element, attrs) {
      var doDisplay = debounce(function(e) {
        var ppos = element.parent().offset();
        var pos = element.offset();
        var rect = element[0].getBoundingClientRect();
        var el = angular.element(attrs.gsnHoverSync);

        el.css({
          top: pos.top - ppos.top,
          left: pos.left - ppos.left,
          width: rect.width,
          height: rect.height
        }).show();
        if (rect.height < 60) {
          el.addClass('link-inline');
        } else {
          el.removeClass('link-inline');
        }
      }, 200);

      element.on('mouseover', doDisplay);
      element.on('click', doDisplay);
    }
  }]);
})(angular);
