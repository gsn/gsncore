(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlMyRecipes';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnProfile', '$controller', myController])
    .directive(myDirectiveName, myDirective);


  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnProfile, $controller) {
    $controller('ctrlBaseRecipeSearch', {
      $scope: $scope
    });

    $scope.activate = activate;
    $scope.vm = {
      recipes: []
    };

    function activate() {
      gsnProfile.getMyRecipes().then(function(result) {
        if (result.success) {
          $scope.vm.recipes = result.response;
        }
      });
    }

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }

})(angular);
