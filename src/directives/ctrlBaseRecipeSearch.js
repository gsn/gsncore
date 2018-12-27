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
      var search = $scope.recipeSearch,
        resultString = '';

      if (gsnApi.isNull(search.course, '').length > 0) {
        resultString = search.course + ' ' + resultString;
      }

      $scope.$emit('gsnevent:closemodal');
      $scope.goUrl('/recipe/search?q=' + encodeURIComponent(resultString));
    };

	$scope.doRecipeSearchNew = function() {
      var search = $scope.recipeSearch,
        resultString = '';

      if (gsnApi.isNull(search.course, '').length > 0) {
        resultString = search.course + ' ' + resultString;
      }

      $scope.$emit('gsnevent:closemodal');
      $scope.goUrl('/recipesearch?q=' + encodeURIComponent(resultString));
    };
  }
})(angular);
