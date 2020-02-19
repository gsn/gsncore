(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('vbox', ['$timeout', function($timeout) {
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
    return directive;

    function link(scope, elm, attrs, ngModel) {
      attrs.$observe('vbox', function(value) {
        var baseEl = element[0];
        if (baseEl) baseEl.setAttributeNS('', value);
      })
    }
  }]);
})(angular);
