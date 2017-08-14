(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnAutoFillSync', ['$timeout', function($timeout) {
    // Usage: Fix syncing issue with autofill form
    //
    // Creates: 2014-08-28 TomN
    //
    var directive = {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
    return directive;

    function link(scope, elm, attrs, ngModel) {
      scope.$on('autofill:update', function() {
        ngModel.$setViewValue(elm.val());
      });
    }
  }]);
})(angular);
