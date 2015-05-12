(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlHome';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnApi', '$routeParams', myController])
    .directive(myDirectiveName, myDirective);


  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnApi, $routeParams) {
    $scope.activate = activate;
    $scope.vm = {};

    function activate() {

      // Set the store id.
      if ($routeParams.setStoreId) {
        gsnApi.setSelectedStoreId($routeParams.setStoreId);
      }
    }

    $scope.activate();
  }

})(angular);