(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('replaceWith', function() {
    // Usage: testValue | replaceWith:'\\s+':'gi':' '
    //
    return function(input, regex, flag, replaceWith) {
      var patt = new RegExp(regex, flag);

      return input.replace(patt, replaceWith);
    };
  });
})(angular);
