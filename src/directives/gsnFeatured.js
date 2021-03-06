(function(angular, undefined) {
  var createDirective, module, pluginName, _i, _len, _ref;

  module = angular.module('gsn.core');

  createDirective = function(name) {
    return module.directive(name, ['gsnStore', 'gsnApi', 'debounce', '$compile', '$analytics', function(gsnStore, gsnApi, debounce, $compile, $analytics) {
      return {
        restrict: 'AC',
        scope: true,
        link: function(scope, element, attrs) {
          var currentStoreId = gsnApi.getSelectedStoreId();

          if (attrs.contentPosition) {
            var dynamicData = gsnApi.parseStoreSpecificContent(gsnApi.getHomeData().ContentData[attrs.contentPosition]);
            if (dynamicData && dynamicData.Description) {
              // track click
              angular.element(element).bind('click', function() {
                // track content click
                $analytics.eventTrack('content-click', {
                  category: 'block-' + attrs.contentPosition,
                  label: dynamicData.Headline
                });
              });
              if (!attrs.inview) {
                element.html(dynamicData.Description);
                $compile(element.contents())(scope);
                // track content refresh
                $analytics.eventTrack('content-imp', {
                  category: 'block-' + attrs.contentPosition,
                  label: dynamicData.Headline
                });
                return;
              }
              else {
                element[0].doRefresh = debounce(function() {
                  element.html(dynamicData.Description);
                  $compile(element.contents())(scope);
                  // track content refresh
                  $analytics.eventTrack('content-imp', {
                    category: 'block-' + attrs.contentPosition,
                    label: dynamicData.Headline
                  });
                }, 2000, true);
                return;
              }
            }
          }

          scope.item = {};
          if (name === 'gsnFtArticle') {
            gsnStore.getFeaturedArticle().then(function(result) {
              if (result.success) {
                result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, '').replace('http://', '//');
                scope.item = result.response;
              }
            });
          } else if (name === 'gsnFtRecipe') {
            gsnStore.getFeaturedRecipe().then(function(result) {
              if (result.success) {
                result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, '').replace('http://', '//');
                angular.forEach(result.response.Images, function(item) {
                  item.RecipeImageUrl = gsnApi.isNull(item.RecipeImageUrl, '').replace('http://', '//');
                });
                scope.item = result.response;
              }
            });
          } else if (name === 'gsnFtAskthechef') {
            gsnStore.getAskTheChef().then(function(result) {
              if (result.success) {
                result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, '').replace('http://', '//');
                scope.item = result.response;
              }
            });
          } else if (name === 'gsnFtVideo') {
            gsnStore.getFeaturedVideo().then(function(result) {
              if (result.success) {
                result.response.Thumbnail = gsnApi.isNull(result.response.Thumbnail, '').replace('http://', '//');
                scope.item = result.response;
              }
            });
          } else if (name === 'gsnFtCookingtip') {
            gsnStore.getCookingTip().then(function(result) {
              if (result.success) {
                result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, '').replace('http://', '//');
                scope.item = result.response;
              }
            });
          } else if (name === 'gsnFtConfig') {
            scope.item = gsnApi.parseStoreSpecificContent(gsnApi.getHomeData().ConfigData[attrs.gsnFtConfig]);
            if (attrs.overwrite && (gsnApi.isNull(scope.item.Description, '').length > 0)) {
              element.html(scope.item.Description);
            }
          } else if (name === 'gsnFtContent') {
            // do nothing, content already being handled by content position
          }
        }
      };
    }]);
  };

  _ref = ['gsnFtArticle', 'gsnFtRecipe', 'gsnFtAskthechef', 'gsnFtCookingtip', 'gsnFtVideo', 'gsnFtConfig', 'gsnFtContent'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    pluginName = _ref[_i];
    createDirective(pluginName);
  }

})(angular);
