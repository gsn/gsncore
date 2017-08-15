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
        attributes = '',
        resultString = '';

      if (gsnApi.isNull(search.term, '').length > 0) {
        resultString += 'SearchTerm:' + gsnApi.isNull(search.term, '') + ';';
      }
      if (gsnApi.isNull(search.preptime, '').length > 0) {
        resultString += 'Time:' + gsnApi.isNull(search.preptime, '') + ';';
      }
      if (gsnApi.isNull(search.skilllevel, '').length > 0) {
        resultString += 'SkillLevelList:|' + gsnApi.isNull(search.skilllevel, '') + '|;';
      }

      angular.forEach(search.attrib, function(value, key) {
        if (gsnApi.isNull(value, '').length > 0) {
          attributes += value + '|';
        }
      });
      if (gsnApi.isNull(attributes, '').length > 0) {
        resultString += 'AttributeList:|' + gsnApi.isNull(attributes, '') + ';';
      }

      $scope.$emit('gsnevent:closemodal');
      $scope.goUrl('/recipe/search?q=' + encodeURIComponent(resultString));
    };
  }

})(angular);
