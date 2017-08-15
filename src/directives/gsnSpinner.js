(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnSpinner', ['$window', '$timeout', 'gsnApi', function($window, $timeout, gsnApi) {
    // Usage:   Display spinner
    //
    // Creates: 2014-01-06
    //
    /*var opts = {
          lines: 13, // The number of lines to draw
          length: 20, // The length of each line
          width: 10, // The line thickness
          radius: 30, // The radius of the inner circle
          corners: 1, // Corner roundness (0..1)
          rotate: 0, // The rotation offset
          direction: 1, // 1: clockwise, -1: counterclockwise
          color: '#000', // #rgb or #rrggbb or array of colors
          speed: 1, // Rounds per second
          trail: 60, // Afterglow percentage
          shadow: false, // Whether to render a shadow
          hwaccel: false, // Whether to use hardware acceleration
          className: 'spinner', // The CSS class to assign to the spinner
          zIndex: 2e9, // The z-index (defaults to 2000000000)
          top: 'auto', // Top position relative to parent in px
          left: 'auto', // Left position relative to parent in px
          stopDelay: 200 // delay before matching ng-show-if
        };
    */
    var directive = {
      link: link,
      restrict: 'A',
      scope: true
    };
    return directive;

    function link(scope, element, attrs) {
      function activate() {
        if (typeof(Spinner) === 'undefined') {
          $timeout(activate, 200);

          if (scope.loadingScript) return;
          scope.loadingScript = true;

          // dynamically load google
          var src = '//cdnjs.cloudflare.com/ajax/libs/spin.js/2.3.2/spin.min.js';

          gsnApi.loadScripts([src], activate);
          return;
        }

        var options = scope.$eval(attrs.gsnSpinner);
        options.stopDelay = options.stopDelay || 200;

        function stopSpinner() {
          if (scope.gsnSpinner) {
            scope.gsnSpinner.stop();
            scope.gsnSpinner = null;
          }
        }

        scope.$watch(attrs.showIf, function(newValue) {
          stopSpinner();
          if (newValue) {
            scope.gsnSpinner = new $window.Spinner(options);
            scope.gsnSpinner.spin(element[0]);

            if (options.timeout) {
              $timeout(function() {
                var val = scope[attrs.showIf];
                if (typeof(val) === 'boolean') {
                  // this should cause it to stop spinner
                  scope[attrs.showIf] = false;
                } else {
                  $timeout(stopSpinner, options.stopDelay);
                }
              }, options.timeout);
            }
          }
        }, true);

        scope.$on('$destroy', function() {
          $timeout(stopSpinner, options.stopDelay);
        });
      }
    }
  }]);
})(angular);
