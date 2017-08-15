(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnSvgImage', ['$window', '$timeout', 'debounce', 'gsnApi', function($window, $timeout, debounce, gsnApi) {

    var directive = {
      link: link,
      restrict: 'A',
    };
    return directive;

    function link(scope, element, attrs) {
      var src = attrs.src,
        svg;
      var width = 0,
        height = 0;

      function doLoadImage() {
        var $win = angular.element($window);
        if (attrs.src === '') {
          $timeout(doLoadImage, 200);
          return;
        }
        element.html('');

        gsnApi.loadImage(attrs.src, function(img) {
          width = img.w;
          height = img.h;

          // set viewBox
          img = angular.element(attrs.gsnSvgImage);
          svg = img.parent('svg');
          // append Image
          svg[0].setAttributeNS('', 'viewBox', '0 0 ' + width + ' ' + height + '');
          img.attr('width', width).attr('height', height).attr('xlink:href', attrs.src);
          img.show();
          var isIE = /Trident.*rv:11\.0/.test(navigator.userAgent) || /msie/gi.test(navigator.userAgent);

          if (isIE && attrs.syncHeight) {
            var resizer = debounce(function() {
              var actualWidth = element.parent().width();
              var ratio = actualWidth / (width || actualWidth || 1);
              var newHeight = ratio * height;

              angular.element(attrs.syncHeight).height(newHeight);

            }, 200);

            resizer();
            $win.on('resize', resizer);
          }

          // re-adjust
          var reAdjust = debounce(function() {
            // click activate to re-arrange item
            angular.element('.onlist').click();

            // remove active item
            $timeout(function() {
              scope.vm.activeItem = null;
              scope.vm.loadCount++;
            }, 200);
          }, 200);
          reAdjust();

          $win.on('resize', reAdjust);
          $win.on('orientationchange', reAdjust);

        }, element);
      }
      var myLoadImage = debounce(doLoadImage, 100);
      scope.$watch(attrs.watch || 'vm.page', myLoadImage);
    }
  }]);
})(angular);
