(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlBaseRecipeSearch';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnApi', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnApi) {
    $scope.recipeSearch = {
      attrib: {}
    };

    $scope.doRecipeSearch = function() {
      var search = gsnApi.isNull($scope.recipeSearch.term, ''),
        resultString = '';

      if (gsnApi.isNull($scope.recipeSearch.course, '').length > 0) {
        resultString = $scope.recipeSearch.course + ' ' + resultString;
      }

      $scope.$emit('gsnevent:closemodal');
      $scope.goUrl('/recipe/search?q=' + encodeURIComponent(resultString.replace(/\s+$/, '')));
    };

	$scope.doRecipeSearchNew = function() {
      var search = gsnApi.isNull($scope.recipeSearch.term, ''),
        resultString = '';

      if (gsnApi.isNull($scope.recipeSearch.course, '').length > 0) {
        resultString = $scope.recipeSearch.course + ' ' + resultString;
      }

      $scope.$emit('gsnevent:closemodal');
      $scope.goUrl('/recipesearch?q=' + encodeURIComponent(resultString.replace(/\s+$/, '')));
    };
  }
})(angular);
