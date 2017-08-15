(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('removeAspx', ['gsnApi', function(gsnApi) {
    // Usage: for removing aspx
    //

    return function(text) {
      return gsnApi.isNull(text, '').replace(/(.aspx\"|.gsn\")+/gi, '"');
    };
  }]);

})(angular);
