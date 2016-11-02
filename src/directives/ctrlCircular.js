(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlCircular';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', '$timeout', 'gsnStore', '$rootScope', '$location', 'gsnProfile', 'gsnApi', '$analytics', '$filter', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, $timeout, gsnStore, $rootScope, $location, gsnProfile, gsnApi, $analytics, $filter) {
    $scope.activate = activate;

    $scope.pageId = 99; // it's always all items for desktop
    $scope.loadAll = $scope.loadAll || false;
    $scope.itemsPerPage = $scope.itemsPerPage || 10;
    $scope.sortBy = $scope.sortBy || 'CategoryName';
    $scope.sortByName = $scope.sortByName || 'Department';
    $scope.actualSortBy = $scope.sortBy;

    $scope.allItems = [];
    $scope.loadMore = loadMore;
    $scope.vm = {
      currentPage: 1,
      pageCount: 1,
      loadCount: 0,
      cacheItems: [],
      digitalCirc: null,
      filterBy: $location.search().q,
      filter: {},
      pageIdx: 0,
      circIdx: 0
    };

    function activate() {
      if ($scope.vm.digitalCirc) {
        return;
      }

      var config = gsnApi.getConfig();
      if ($scope.currentPath == '/circular' && (gsnApi.isNull(config.defaultMobileListView, null) === null)) {
        config.defaultMobileListView = true;
        var mobileListViewUrl = gsnApi.getThemeConfigDescription('default-mobile-listview');
        if (gsnApi.browser.isMobile && mobileListViewUrl) {
          gsnApi.goUrl(mobileListViewUrl);
          return;
        }
      }

      // broadcast message
      $rootScope.$broadcast('gsnevent:loadads');

      if (gsnStore.hasCompleteCircular()) {
        var data = gsnStore.getCircularData();

        //Filter circulars
        if (data.Circulars.length > 0) {
          var filteredByStoreCircs = []
          var storeId = gsnApi.isNull(gsnApi.getSelectedStoreId(), 0);
          angular.forEach(data.Circulars, function(circ) {
            if (gsn.contains(circ.StoreIds, storeId)) {
              filteredByStoreCircs.push(circ);
            }
          });
          data.Circulars = filteredByStoreCircs;
        } else {
          return;
        }

        var myPageIdx = parseInt($location.search().p || $location.search().pg || 0);
        var myCircIdx = parseInt($location.search().c || 0);
        if (data.Circulars.length == 1) {
          myCircIdx = myCircIdx || 1;
          myPageIdx = myPageIdx || 1;
        }

        $scope.doSearchInternal();
        $scope.vm.digitalCirc = data;
        $scope.vm.circIdx = myCircIdx;
        $scope.vm.pageIdx = myPageIdx;
      }
    }
    //To Add the item to the shopping list
    $scope.addFlyerItems = function(item, itemId) {
      
       var shoppinglists = gsnProfile.getShoppingLists();
       
     var tempItemObject =  [{
            "StartDate": null,
            "EndDate": null,
            "ItemTypeId": 0,
            "ItemId": itemId,
            "RecipeId": null,
            "FoodId": null,
            "BrandName": null,
            "Description": null,
            "Description1": null,
            "Description2": null,
            "Description3": null,
            "Description4": null,
            "Comment": null,
            "ShoppingListItemId": itemId,
            "CategoryId": null,
            "Quantity": null,
            "Order": null,
            "ImageUrl": null,
            "TopTagLine": null,
            "SmallImageUrl": null,
            "BarcodeImageUrl": null,
            "ItemRaw": null,
            "IsCoupon": null,
            "Meta": ""
           }]
      var temp = [{
            "Id": "",
            "ShoppingListId": shoppinglists[0].ShoppingListId,
            "ItemId": itemId,
            "ItemTypeId": "0",
            "Quantity": 1,
            "CategoryId": "",
            "CategoryName": "",
            "Description": "",
            "CreateDate ": "",
            "ModifyDate": "",
            "Weight": "",
            "Comment": "",
            "IsVisible": "",
            "IsActive": "",
            "BrandName": "",
            "AdCode": "",
            "IsCoupon": "",
            "ShelfId": "",
            "Meta": JSON.stringify(item)
          }] 
        //tempItemObject.ShoppingListItemId = shoppinglists[0].ShoppingListId;
        //Calling Shopping ListTwo Service
       // gsnRoundyProfile.saveItems(shoppinglists[0].ShoppingListId, tempItemObject);
        var shoppingList = gsnList(shoppinglists[0].ShoppingListId, shoppinglists[0].items)
        //Calling Shopping List Service
        shoppingList.addItems(temp);
    };
    //To remove the item from the shopping list
    $scope.removeItemFromFlyer = function(item, itemId) {
       var shoppinglists = gsnProfile.getShoppingLists();
       var shoppingList = gsnList(shoppinglists[0].ShoppingListId, shoppinglists[0].items)
       var temp = {
            "Id": "",
            "ShoppingListId": shoppinglists[0].ShoppingListId,
            "ItemId": itemId,
            "ItemTypeId": "0",
            "Quantity": 1,
            "CategoryId": "",
            "CategoryName": "",
            "Description": "",
            "CreateDate ": "",
            "ModifyDate": "",
            "Weight": "",
            "Comment": "",
            "IsVisible": "",
            "IsActive": "",
            "BrandName": "",
            "AdCode": "",
            "IsCoupon": "",
            "ShelfId": "",
            "Meta": JSON.stringify(item)
          }
          shoppinglists[0].removeItem(temp);
    };
    $scope.doAddCircularItem = function(evt, tempItem) {
      var item = gsnStore.getItem(tempItem.ItemId);
      if (item) {
        gsnProfile.addItem(item);

        if (gsnApi.isNull(item.Varieties, null) === null) {
          item.Varieties = [];
        }

        $scope.vm.selectedItem = item;
        $scope.gvm.selectedItem = item;
      }
    };

    $scope.doToggleCircularItem = function(evt, tempItem) {
      if ($scope.isOnList(tempItem)) {
        gsnProfile.removeItem(tempItem);
      } else {
        $scope.doAddCircularItem(evt, tempItem);
      }
    };

    $scope.toggleSort = function(sortBy) {
      $scope.sortBy = sortBy;
      var reverse = (sortBy == $scope.actualSortBy);
      $scope.actualSortBy = ((reverse) ? '-' : '') + sortBy;
      $scope.doSearchInternal();
    };

    $scope.getIndex = function(step) {
      var newIndex = parseInt($scope.vm.pageIdx || 1) + step;
      if (newIndex > $scope.vm.pageCount) {
        newIndex = 1;
      } else if (newIndex < 1) {
        newIndex = $scope.vm.pageCount;
      }

      return newIndex;
    };

    $scope.$on('gsnevent:shoppinglist-loaded', activate);
    $scope.$on('gsnevent:digitalcircular-itemselect', $scope.doAddCircularItem);

    $scope.$watch('vm.selectedItem', function(newValue, oldValue) {
      if (newValue) {
        if (gsnApi.isNull(newValue.Varieties, []).length > 0) return;
        if (newValue.LinkedItemCount <= 0) return;

        gsnStore.getAvailableVarieties(newValue.ItemId).then(function(result) {
          if (result.success) {
            // this is affecting the UI so render it on the UI thread
            $timeout(function() {
              newValue.Varieties = result.response;
            }, 0);
          }
        });
      }
    });

    $scope.doSearchInternal = function() {
      var circularType = gsnStore.getCircular($scope.pageId);
      var list = gsnProfile.getShoppingList();

      // don't show circular until data and list are both loaded
      if (gsnApi.isNull(circularType, null) === null || gsnApi.isNull(list, null) === null) return;

      var result1 = $filter('filter')(circularType.items, $scope.vm.filter);
      var result = $filter('orderBy')($filter('filter')(result1, $scope.vm.filterBy || ''), $scope.actualSortBy);
      if (!$scope.vm.circularType) {
        $scope.vm.circularType = circularType;
        $scope.vm.categories = gsnApi.groupBy(circularType.items, 'CategoryName');
        $scope.vm.brands = gsnApi.groupBy(circularType.items, 'BrandName');
      }

      $scope.vm.cacheItems = result;
      $scope.vm.pageCount = Math.ceil(result.length / $scope.itemsPerPage);
      $scope.allItems = [];
      loadMore();
    };

    $scope.$watch('vm.filterBy', $scope.doSearchInternal);
    $scope.$watch('vm.filter.BrandName', $scope.doSearchInternal);
    $scope.$watch('vm.filter.CategoryName', $scope.doSearchInternal);
    $scope.$watch('vm.pageIdx', setPage);
    $scope.$watch('vm.circIdx', setPage);

    $scope.$on('gsnevent:circular-loaded', function(event, data) {
      if (data.success) {
        $scope.vm.noCircular = false;
        $timeout(activate, 500);
      } else {
        $scope.vm.noCircular = true;
      }
    });

    $timeout(activate, 500);

    // activate again in 5 seconds if not responsive
    $timeout(function() {
      var items = $scope.vm.cacheItems || [];
      if (items.length <= 0) {
        activate();
      }
    }, 5000);

    //#region Internal Methods
    function sortMe(a, b) {
      if (a.rect.x <= b.rect.x) return a.rect.y - b.rect.y;
      return a.rect.x - b.rect.x;
    }

    function setPage(oldValue, newValue) {
      if (!$scope.vm.digitalCirc) return;
      if (!$scope.vm.digitalCirc.Circulars) return;
      if ($scope.vm.digitalCirc.Circulars.length <= 0) return;

      $scope.vm.circular = $scope.vm.digitalCirc.Circulars[$scope.vm.circIdx - 1];
      if ($scope.vm.circular) {
        if ($scope.vm.pageIdx < 1) {
          $scope.vm.pageIdx = 1;
          return;
        }

        $scope.vm.pageCount = $scope.vm.circular.Pages.length;
        $scope.vm.page = $scope.vm.circular.Pages[$scope.vm.pageIdx - 1];
        if (!$scope.vm.page.sorted) {
          $scope.vm.page.Items.sort(sortMe);
          $scope.vm.page.sorted = true;
        }
      }
      if (oldValue != newValue) {
        var pageIdx = gsnApi.isNull($scope.vm.pageIdx, 1);
        // must use timeout to sync with UI thread
        $timeout(function() {
          // trigger ad refresh for circular page changed
          $rootScope.$broadcast('gsnevent:digitalcircular-pagechanging', {
            circularIndex: $scope.vm.circIdx,
            pageIndex: pageIdx
          });
        }, 50);

        var circ = $scope.vm.circular;
        if (circ) {
          $analytics.eventTrack('PageChange', {
            category: 'Circular_Type' + circ.CircularTypeId + '_P' + pageIdx,
            label: circ.CircularDescription
          });
        }
      }
    }

    function loadMore() {
      var items = $scope.vm.cacheItems || [];
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

  //#endregion
  }
})(angular);
