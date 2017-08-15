(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnAdUnit', ['gsnStore', '$timeout', 'gsnApi', '$rootScope', '$http', '$templateCache', '$interpolate', function(gsnStore, $timeout, gsnApi, $rootScope, $http, $templateCache, $interpolate) {
    // Usage: create an adunit and trigger ad refresh
    //
    // Creates: 2014-04-05 TomN
    //
    var directive = {
      restrict: 'A',
      link: link
    };
    return directive;

    function link(scope, elm, attrs) {
      scope.templateHtml = null;
      var tileId = gsnApi.isNull(attrs.gsnAdUnit, '');

      if (tileId.length > 0) {
        var templateUrl = gsnApi.getThemeUrl('/../common/views/tile' + tileId + '.html');
        var templateLoader = $http.get(templateUrl, {
          cache: $templateCache
        });
        var hasTile = false;

        templateLoader.success(function(html) {
          scope.templateHtml = html;
        }).then(linkTile);
      }

      function linkTile() {
        // ignore duplicate tile
        if (tileId === 5) {
          return;
        }

        if (tileId.length > 0) {
          if (scope.templateHtml) {
            elm.html(scope.templateHtml);
            var html = $interpolate(scope.templateHtml)(scope);
            elm.html(html);

            // broadcast message
            $rootScope.$broadcast('gsnevent:loadads');
          }
        } else {
          // find adunit
          elm.find('.gsnadunit').addClass('brickunit');

          // broadcast message
          $rootScope.$broadcast('gsnevent:loadads');
        }
      }
    }
  }]);
})(angular);
