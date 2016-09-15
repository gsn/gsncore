(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnAddHead', ['$window', '$timeout', 'gsnApi', function ($window, $timeout, gsnApi) {
    // Usage:   Add element to head
    //
    // Creates: 2014-01-06
    //
    /* <div gsn-add-head="meta" data-attributes="{'content': ''}"></div>
    */
    var directive = {
      link: link,
      restrict: 'A',
      scope: true
    };
    return directive;

    function link(scope, element, attrs) {
      var elId = 'dynamic-' + (new Date().getTime());
      function activate() {
        var el = angular.element('<' + attrs.ngAddHead + '>');
        if (options) {
          var myAttrs = scope.$eval(attrs.attributes);
          el.id = elId;
          angular.forEach(myAttrs, function (v, k) {
            el.attr(k, v);
          });
        }

        angular.element('head')[0].appendChild(el[0]);

        scope.$on('$destroy', function () {
          angular.element('#' + elId).remove();
        });
      }

      activate();
    }
  }]);
})(angular);