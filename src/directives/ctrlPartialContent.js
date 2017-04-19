(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlPartialContent';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnApi', 'gsnStore', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnApi, gsnStore) {
    $scope.activate = activate;
    $scope.notFound = false;
    $scope.contentDetail = {
      url: angular.lowercase(gsnApi.isNull($scope.currentPath.replace(/^\/+/gi, ''), '').replace(/[\-]/gi, ' ')),
      name: '',
      subName: ''
    };
    var partialData = { ContentData: {}, ConfigData: {}, ContentList: [] };

    function activate() {
      // parse contentName by forward slash
      var contentNames = $scope.contentDetail.url.split('/');
      if (contentNames.length > 1) {
        $scope.contentDetail.subName = contentNames[1];
      }

      $scope.contentDetail.name = contentNames[0];

      if ($scope.contentDetail.url.indexOf('.aspx') > 0) {
        // do nothing for aspx page
        $scope.notFound = true;
        return;
      }

      // attempt to retrieve static content remotely
      gsnStore.getPartial($scope.contentDetail.name).then(function (rst) {
        if (rst.success) {
          processData(rst.response);
        } else {
          $scope.notFound = true;
        }
      });
    }

    $scope.getContentList = function () {
      var result = [];
      if (partialData.ContentList) {
        for (var i = 0; i < partialData.ContentList.length; i++) {
          var data = result.push(gsnApi.parseStoreSpecificContent(partialData.ContentList[i]));
          if (data.Description) {
            if (gsnApi.isNull($scope.contentDetail.subName, 0).length <= 0) {
              result.push(data);
              continue;
            }

            if (angular.lowercase(data.Headline) == $scope.contentDetail.subName || data.SortBy == $scope.contentDetail.subName) {
              result.push(data);
            }
          }
        }
      }

      return result;
    };

    $scope.getContent = function (index) {
      return result.push(gsnApi.parseStoreSpecificContent(partialData.ContentData[index]));
    };

    $scope.getConfig = function (name) {
      return gsnApi.parseStoreSpecificContent(partialData.ConfigData[name]) || {};
    };

    $scope.getConfigDescription = function (name, defaultValue) {
      var resultObj = $scope.getConfig(name).Description;
      return gsnApi.isNull(resultObj, defaultValue);
    };

    $scope.activate();

    //#region Internal Methods
    function processData(data) {
      partialData = gsnApi.parsePartialContentData(data);
    }
    //#endregion
  }

})(angular);
