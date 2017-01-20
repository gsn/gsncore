(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlArticle';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$location', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi, $location) {
    var pathId = angular.lowercase($location.path()).replace(/\D*/, '')
    $scope.myId = ($location.search().id || pathId || 'featured');

    $scope.activate = activate;

    function activate() {
      if ($scope.myId == 'featured' || $scope.myId === '') {
        if ($scope.currentPath.indexOf('featured') < 0) {
          $scope.goUrl('/article/featured');
          return;
        }
      }

      var myFunction = gsnStore.getFeaturedArticle();
      if ($scope.myId != 'featured') {
        myFunction = gsnStore.getArticle($scope.myId);
      }

      myFunction.then(function (result) {
        if (result.success) {
          result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, {}).replace('http://', '//');
          $scope.article = result.response;
        }
      });
    }

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }
})(angular);
