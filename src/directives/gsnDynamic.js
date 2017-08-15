(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnDynamic', ['$compile', function($compile) {
    var directive = {
      restrict: 'A',
      replace: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      scope.$watch(attrs.dynamic, function(html) {
        element.html(html);
        $compile(element.contents())(scope);
      });
    }
  }]);

})(angular);
