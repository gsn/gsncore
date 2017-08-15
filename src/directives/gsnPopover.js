(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnPopover', ['$window', '$interpolate', '$timeout', 'debounce', function($window, $interpolate, $timeout, debounce) {
    // Usage:   provide mouse hover capability
    //
    // Creates: 2014-01-16
    //
    var directive = {
      link: link,
      restrict: 'AE'
    };
    return directive;

    function hidePopup() {
      $timeout(function() {
        angular.element('.gsn-popover').slideUp();
      }, 1500);
    }

    function link(scope, element, attrs) {
      var text = '',
        title = attrs.title || '';

      // wait until finish interpolation
      $timeout(function() {
        text = angular.element(attrs.selector).html() || '';
      }, 50);

      var popover = angular.element('.gsn-popover');
      if (popover.length > 0) {
        var myTimeout;
        var myHidePopup = debounce(hidePopup, 1500);
        element.mousemove(function(e) {
          angular.element('.gsn-popover .popover-title').html($interpolate('<div>' + title + '</div>')(scope).replace('data-ng-src', 'src'));
          angular.element('.gsn-popover .popover-content').html($interpolate('<div>' + text + '</div>')(scope).replace('data-ng-src', 'src'));

          // reposition
          var offset = angular.element(this).offset();
          var height = popover.show().height();

          angular.element('.gsn-popover').css({
            top: e.clientY + 15,
            left: e.clientX + 15
          }).show();
          myHidePopup();
        }).mouseleave(myHidePopup);
        popover.mousemove(myHidePopup);
      } else { // fallback with qtip
        element.qtip({
          content: {
            text: function() {
              var rst = $interpolate('<div>' + text + '</div>')(scope).replace('data-ng-src', 'src');
              return rst;
            },
            title: function() {
              var rst = $interpolate('<div>' + title + '</div>')(scope).replace('data-ng-src', 'src');
              return (rst.replace(/\s+/gi, '').length <= 0) ? null : rst;
            }
          },
          style: {
            classes: attrs.classes || 'qtip-light qtip-rounded qtip-shadow'
          },
          show: {
            event: 'click mouseover',
            solo: true
          },
          hide: {
            distance: 1500
          },
          position: {
            // my: 'bottom left',
            at: 'bottom left'
          }
        });
      }

      scope.$on('$destroy', function() {
        if (popover.length <= 0) {
          element.qtip('destroy', true); // Immediately destroy all tooltips belonging to the selected elements
        }
      });
    }
  }]);
})(angular);
