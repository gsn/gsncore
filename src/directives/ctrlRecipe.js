(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRecipe';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$location', '$window', '$timeout', 'gsnProfile', '$controller', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi, $location, $window, $timeout, gsnProfile, $controller) {
    $controller('ctrlBaseRecipeSearch', {
		$scope: $scope
	});

    $scope.activate = activate;
    $scope.addSelectedIngredients = addSelectedIngredients;
    $scope.selectAllIngredients = selectAllIngredients;
    $scope.vm = {
      recipe: {},
      recipeRating: { myRating: -1 },
      savedRecipe: { RecipeInfo: {} }
    };
    var pathRecipeId = angular.lowercase($location.path()).replace(/\D*/, '')
    $scope.recipeId = ($location.search().id || pathRecipeId || 'featured');
    $scope.recipeQuantity = null;

    function activate() {
      if ($scope.recipeId == 'featured' || $scope.recipeId === '') {
        if ($scope.currentPath.indexOf('featured') < 0) {
          $scope.goUrl('/recipe/featured');
          return;
        }
      }

      var myFunction = gsnStore.getFeaturedRecipe();
      if ($scope.recipeId != 'featured') {
        myFunction = gsnStore.getRecipe($scope.recipeId);
      }

      myFunction.then(function (result) {
        if (result.success) {
          result.response.ImageUrl = (result.response.ImageUrl || {}).replace('http://', '//');
          $scope.vm.recipe = result.response;

          $scope.nutrients = gsnApi.mapObject($scope.vm.recipe.Nutrients, 'Description');
          // caculate recipe rating
          var ratingTotal = 0;
          $scope.vm.recipeRating.userCount = $scope.vm.recipe.Ratings.length;
          $scope.vm.recipeRating.rating = 0;
          var myProfileId = gsnApi.getProfileId();
          if ($scope.vm.recipeRating.userCount > 0) {
            angular.forEach($scope.vm.recipe.Ratings, function (item) {
              ratingTotal += item.Rating;
              if (myProfileId == item.ConsumerId) {
                $scope.vm.recipeRating.myRating = item.Rating;
              }
            });

            $scope.vm.recipeRating.rating = Math.round(ratingTotal / $scope.vm.recipeRating.userCount);
          }

          if ($scope.currentPath.indexOf('print') > 0) {
            $timeout(function () {
              $window.print();
            }, 1000);
          }
        }
      });

      myFunction.then(function (result) {
        if (result.success) {
          $scope.vm.savedRecipe = result.response[0];
        }
      });

    }

    $scope.doSaveRecipe = function (item) {
      gsnProfile.saveRecipe($scope.vm.recipe.RecipeId, item.Comment);
      $scope.$emit('gsnevent:closemodal');
    };

    $scope.$watch("vm.recipeRating.myRating", function (newValue, oldValue) {
      if (newValue > 0) {
        gsnProfile.rateRecipe($scope.vm.recipe.RecipeId, newValue);
      }
    });

    $scope.activate();

    //#region Internal Methods
    function addSelectedIngredients() {
      var toAdd = [];
      angular.forEach($scope.vm.recipe.Ingredients, function (v, k) {
        if (v.selected) {
            v.Quantity = 1;
            v.Comment=v.StandardText;

          toAdd.push(v);
        }
      });

      gsnProfile.addItems(toAdd);
    }

    function selectAllIngredients() {
      angular.forEach($scope.vm.recipe.Ingredients, function (item) {
        item.selected = true;
      });
    }
    //#endregion
  }

})(angular);
