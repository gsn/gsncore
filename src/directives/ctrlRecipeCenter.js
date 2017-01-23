(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRecipeCenter';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$controller', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi, $controller) {
    $controller('ctrlBaseRecipeSearch', {
		$scope: $scope
	});

    $scope.activate = activate;
    $scope.vm = {
      mealPlanners: [],
      mealPlannerTeasers: [],
      quickSearchItems: [],
      videos: []
    };

    function activate() {

      gsnStore.getRecipeVideos().then(function (result) {
        if (result.success) {
          $scope.vm.videos = result.response;
        }
      });

      gsnStore.getFeaturedVideo().then(function (result) {
        if (result.success) {
          result.response.Thumbnail = gsnApi.isNull(result.response.Thumbnail, {}).replace('http://', '//');
          $scope.vm.featuredVideo = result.response;
        }
      });

      gsnStore.getQuickSearchItems().then(function (rst) {
        if (rst.success) {
          gsnApi.sortOn(rst.response, 'ParentOrder');
          $scope.vm.quickSearchItems = gsnApi.groupBy(rst.response, 'ParentName');
        }
      });

      gsnStore.getTopRecipes().then(function (rst) {
        if (rst.success) {
          $scope.vm.topRecipes = rst.response;
        }
      });

      gsnStore.getFeaturedRecipe().then(function (result) {
        if (result.success) {
          result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, {}).replace('http://', '//');
          angular.forEach(result.response.Images, function (item) {
            item.RecipeImageUrl = (item.RecipeImageUrl || {}).replace('http://', '//');
          });
          $scope.vm.featuredRecipe = result.response;
        }
      });

      gsnStore.getAskTheChef().then(function (result) {
        if (result.success) {
          result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, {}).replace('http://', '//');
          $scope.vm.askTheChef = result.response;
        }
      });

      gsnStore.getFeaturedArticle().then(function (result) {
        if (result.success) {
          result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, {}).replace('http://', '//');
          $scope.vm.featuredArticle = result.response;
        }
      });

      gsnStore.getCookingTip().then(function (result) {
        if (result.success) {
          result.response.ImageUrl = gsnApi.isNull(result.response.ImageUrl, {}).replace('http://', '//');
          $scope.vm.cookingTip = result.response;
        }
      });

      gsnStore.getMealPlannerRecipes().then(function (rst) {
        if (rst.success) {
          $scope.vm.mealPlanners = gsnApi.groupBy(rst.response, 'DisplayOrderDate');

          var teasers = [];
          var i = 0;
          angular.forEach($scope.vm.mealPlanners, function (group) {
            if (i++ > 2) return;
            var g = { DisplayDate: group.items[0].DisplayDate, items: [] };
            teasers.push(g);
            var j = 0;
            angular.forEach(group.items, function (item) {
              if (j++ > 2) return;
              g.items.push(item);
            });
          });

          $scope.vm.mealPlannerTeasers = teasers;
        }
      });
    }

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }

})(angular);
