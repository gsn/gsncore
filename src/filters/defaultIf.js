(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('defaultIf', ['gsnApi', function(gsnApi) {
    // Usage: testValue | defaultIf:testValue == 'test'
    //    or: testValue | defaultIf:someTest():defaultValue
    //

    return function(input, conditional, defaultOrFalseValue) {
      var localCondition = conditional;
      if (typeof(conditional) === 'function') {
        localCondition = conditional();
      }
      return localCondition ? defaultOrFalseValue : input;
    };
  }]);

})(angular);
