(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');
  myModule.directive('gsnPartialContent', ['$timeout', 'gsnStore', 'gsnApi', '$location', '$anchorScroll', function($timeout, gsnStore, gsnApi, $location, $anchorScroll) {
    // Usage:   allow for store specific partial content
    //
    // Creates: 2015-02-26
    //
    var directive = {
      link: link,
      restrict: 'EA',
      scope: true,
    };
    return directive;

    function link(scope, element, attrs) {
      var currentPath = gsnApi.isNull($location.path(), '');
      if (currentPath.indexOf('/recipe/') > -1) {
        if (currentPath !== '/recipe/search') {
          currentPath = '/recipe';
        }
      } else if (currentPath.indexOf('/article/') > -1) {
        currentPath = '/article';
      } else if (currentPath.indexOf('/recipevideo/') > -1) {
        currentPath = '/recipevideo';
      } else if (currentPath.indexOf('/store/') > -1) {
        currentPath = '/store';
      }

      attrs.gsnPartialContent = angular.lowercase(attrs.gsnPartialContent || currentPath).replace(/^\/+|\/+$/, '').replace(/[\-\/]/gi, ' ');
      scope.activate = activate;
      scope.pcvm = {
        hasScript: false,
        notFound: false,
        isLoading: true,
        layout: 'default',
        tab: $location.search().tab || 0
      };
      scope.partialContents = [];
      scope.contentDetail = {
        url: attrs.gsnPartialContent
      };
      var partialData = {
        ContentData: {},
        ConfigData: {},
        ContentList: []
      };

      function activate() {
        // attempt to retrieve static content remotely
        gsnStore.getPartial(scope.contentDetail.url).then(function(rst) {
          scope.pcvm.hasScript = false;
          scope.pcvm.isLoading = false;
          if (rst.success) {
            scope.pcvm.notFound = rst.response === 'null';
            processData(rst.response);
          }
        });
      }
      scope.getContentList = function() {
        var result = [];
        if (partialData.ContentList) {
          for (var i = 0; i < partialData.ContentList.length; i++) {
            var data = gsnApi.parseStoreSpecificContent(partialData.ContentList[i]);
            if (data.Headline || data.SortBy) {
              // match any script with src
              if (/<script.+src=/gi.test(data.Description || '')) {
                scope.pcvm.hasScript = true;
              }
              result.push(data);
            }
          }
        }
        return result;
      };
      scope.getContent = function(index) {
        return gsnApi.parseStoreSpecificContent(partialData.ContentData[index]);
      };
      scope.getConfig = function(name) {
        return gsnApi.parseStoreSpecificContent(partialData.ConfigData[name]) || {};
      };
      scope.getConfigDescription = function(name, defaultValue) {
        var resultObj = scope.getConfig(name).Description;
        return gsnApi.isNull(resultObj, defaultValue);
      };
      scope.activate();
      //#region Internal Methods
      function processData(data) {
        partialData = gsnApi.parsePartialContentData(data);
        scope.partialContents = scope.getContentList();
        scope.pcvm.layout = scope.getConfig('layout').Description || 'default';
        if ($location.hash()) {
          $timeout(function() {
            $anchorScroll();
            angular.element('a[href="#' + $location.hash() + '"]').click();
          }, 1000);
        }
      }
      //#endregion
    }
  }]);
})(angular);
