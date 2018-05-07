(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRecipeSearch';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnApi', 'gsnStore', '$routeParams', '$controller', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnApi, gsnStore, $routeParams, $controller) {
    $controller('ctrlBaseRecipeSearch', {
      $scope: $scope
    });

    $scope.activate = activate;
    $scope.categories = [];
    $scope.vm = {
      searchResult: null
    };

    $scope.totalItems = 500;
    $scope.currentPage = 1;
    $scope.itemsPerPage = 24;

    function activate() {
      var search = gsnApi.isNull($routeParams.q, '');
      if (search.indexOf(':') < 0) {
        search = 'SearchTerm:' + search;
      }
      gsnStore.searchRecipes(search).then(function(rst) {
        if (rst.success) {
          $scope.vm.searchResult = rst.response;
          $scope.totalItems = rst.response.length;
        }
      });
    }

    $scope.activate();

    //#region Internal Methods
    //#endregion
  }

})(angular);
