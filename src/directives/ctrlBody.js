(function (angular, undefined) {
  'use strict';

  // TODO: Refactor this thing when there are time, too much globally WTF in here - the result of rushing to release
  var myDirectiveName = 'ctrlBody';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', '$timeout', 'gsnGlobal', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, $timeout, gsnGlobal) {
    gsnGlobal.init(false, $scope);
    /* TODO see if we can lazy load google maps here
    $scope.$on('ocLazyLoad.componentLoaded', function(e, module) {
      if (module[1] === "directive"
        && module[2] === "ctrlStoreLocatorLoader") {

      $timeout(checkIfGoogleMapsIsLoaded, 2000);
      }
    });

    var checkIfGoogleMapsIsLoaded = function() {
      if (window.google && google.maps) {
        console.log(JSON.stringify(google.maps.modules));
        console.log('Maps loaded!');
      }
      else {
        console.log("waiting for google maps");
        $timeout(checkIfGoogleMapsIsLoaded, 200);
      }
    }
    */
  }
})(angular);
