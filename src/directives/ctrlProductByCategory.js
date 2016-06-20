(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlProductByCategory';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnApi', 'gsnStore', '$filter', '$timeout', '$q', myController])
    .directive(myDirectiveName, myDirective);


  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnApi, gsnStore, $filter, $timeout, $q) {
    $scope.activate = activate;
    $scope.loadMore = loadMore;
    $scope.categories = [];
    $scope.vm = {
      noCircular: false,
      saleItemOnly: false,
      parentCategories: [],
      childCategories: [],
      levelOneCategory: null,
      levelTwoCategory: null,
      levelThreeCategory: null,
      allProductsByCategory: null,
      filteredProducts: {},
      showLoading: false,
      filterBy: '',
      sortBy: 'BrandName',
      childCategoryById: {}
    };
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.loadAll = $scope.loadAll || true;
    $scope.allItems = [];
	$scope.activated = false;

    function activate() {
	  $scope.activated = true;
      if (!gsnStore.hasCompleteCircular()) return;
		
      // activate depend on URL
      var catDefer = ($scope.vm.saleItemOnly) ? gsnStore.getSaleItemCategories : gsnStore.getInventoryCategories;
      catDefer().then(function (rsp) {
        var categories = rsp.response;
        angular.forEach(categories, function (item) {
          if (gsnApi.isNull(item.CategoryId, -1) < 0) return;
          if (gsnApi.isNull(item.ParentCategoryId, null) === null) {
            $scope.vm.parentCategories.push(item);
          } else {
            $scope.vm.childCategories.push(item);
          }
        });

        gsnApi.sortOn($scope.vm.parentCategories, 'CategoryName');
        gsnApi.sortOn($scope.vm.childCategories, 'CategoryName');

        $scope.vm.childCategoryById = gsnApi.mapObject(gsnApi.groupBy($scope.vm.childCategories, 'ParentCategoryId'), 'key');
      });
    }

    $scope.getChildCategories = function (cat) {
      return cat ? $scope.vm.childCategories : [];
    };

    $scope.$watch('vm.filterBy', function (newValue, oldValue) {
      if ($scope.vm.showLoading) return;
      $timeout(doFilterSort, 500);
    });

    $scope.$watch('vm.sortBy', function (newValue, oldValue) {
      if ($scope.vm.showLoading) return;
      $timeout(doFilterSort, 500);
    });

    
	  $scope.$on('gsnevent:circular-processed', function(event, data) {
      if (!$scope.activated) activate();
    });    

    
    $scope.$watch('vm.levelOneCategory', function (newValue, oldValue) {
      $scope.vm.levelTwoCategory = null;
      $scope.vm.levelThreeCategory = null;
    });

    $scope.$watch('vm.levelTwoCategory', function (newValue, oldValue) {
      $scope.vm.levelThreeCategory = null;
      if (newValue) {
        var selectedValue = $scope.vm.childCategoryById[newValue.CategoryId];
        if (gsnApi.isNull(selectedValue, { items: [] }).items.length == 1) {
          $scope.vm.levelThreeCategory = selectedValue.items[0];
        }
      }
    });

    $scope.$watch('vm.levelThreeCategory', function (newValue, oldValue) {
      if (newValue) {
        $scope.vm.showLoading = true;
        $scope.vm.filteredProducts = {};
        getData($scope.vm.levelOneCategory.CategoryId, newValue.CategoryId).then(doFilterSort);
      }
    });

    //#region Internal Methods 
    function loadMore() {
      var items = $scope.vm.filteredProducts.fitems || [];
      if (items.length > 0) {
        var itemsToLoad = $scope.itemsPerPage;
        if ($scope.loadAll) {
          itemsToLoad = items.length;
        }

        var last = $scope.allItems.length - 1;
        for (var i = 1; i <= itemsToLoad; i++) {
          var item = items[last + i];
          if (item) {
            $scope.allItems.push(item);
          }
        }
      }
    }

    function doFilterSort(data) {
      $scope.vm.showLoading = false;

      if (data) {
        $scope.vm.filteredProducts = data;
      }

      if ($scope.vm.filteredProducts.items) {
        var result = $filter('filter')($scope.vm.filteredProducts.items, $scope.vm.filterBy || '');
        $scope.vm.filteredProducts.fitems = $filter('orderBy')(result, $scope.vm.sortBy || 'BrandName');
        $scope.allItems = [];
        loadMore();
      }
    }

    function getData(departmentId, categoryId) {
      var deferred = $q.defer();
      if ($scope.vm.saleItemOnly) {
        gsnStore.getSaleItems(departmentId, categoryId).then(function (result) {
          if (result.success) {
            deferred.resolve({ items: result.response });
          }
        });
      } else {
        gsnStore.getInventory(departmentId, categoryId).then(function (result) {
          if (result.success) {
            deferred.resolve({ items: result.response });
          }
        });
      }

      return deferred.promise;
    }
    //#endregion
  }

})(angular);