(function(gsn, angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlCircularNew';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', '$timeout', 'gsnStore', '$rootScope', '$location', 'gsnProfile', 'gsnApi', '$analytics', '$filter', '$http', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, $timeout, gsnStore, $rootScope, $location, gsnProfile, gsnApi, $analytics, $filter, $http) {
    $scope.activate = activate;
    $scope.loadAll = true;
    $scope.itemsPerPage = $scope.itemsPerPage || 100;
    $scope.sortBy = $scope.sortBy || 'PageNumber';
    $scope.sortByName = $scope.sortByName || 'Page';
    $scope.actualSortBy = $scope.sortBy;

    $scope.allItems  = [];
    $scope.itemsById = {};
    $scope.loadMore  = loadMore;
    $scope.vm = {
      noCircular: false,
      currentPage: 1,
      pageCount: 1,
      loadCount: 0,
      cacheItems: [],
      digitalCirc: null,
      filterBy: $location.search().q,
      filter: {},
      pageIdx: 0,
      circIdx: 0,
      circular: {
        CircularTypeName: 'Weekly Ads',
        Pages: [],
        IsDumnewCirc: true
      },
      newCirc: null
    };

    function loadServerCircular(store) {
      var dateobj = new Date();
      var url = gsnApi.getConfig().NewCircularUrl;
      var url = url.replace('{chainId}', gsnApi.getChainId()).replace('{storeNumber}', store.StoreNumber) + dateobj.toISOString().substr(0, 10);

      // clear every hours
      url += '&cb=' +  dateobj.toISOString().substr(0, 13);
      $http.get(url).success(function(response) {
        $scope.vm.newCirc = response.message;
        loadCircular();
      }).error(function(response) {
        // do nothing
        $scope.vm.newCirc    = null;
        $scope.vm.noCircular = true;
      });
    }

    function loadCircular() {
      if (!$scope.vm.newCirc) {
        return;
      }

      var myPageIdx = parseInt($location.search().p || $location.search().pg || 0);
      var myCircIdx = parseInt($location.search().c || 0);
      if ($scope.vm.newCirc.Circulars.length === 1) {
        myCircIdx = myCircIdx || 1;
        myPageIdx = myPageIdx || 1;
      }

      $scope.allItems.length = 0;

      angular.forEach($scope.vm.newCirc.Circulars, function(c){
        angular.forEach(c.Pages, function(p){
          angular.forEach(p.Items, function(i){
            i.PageNumber     = p.PageNumber;
            i.CircularPageId = p.CircularPageId;
            i.CircularId     = c.CircularId;
            $scope.allItems.push(i);
          });
        });
      });

      $scope.itemsById = gsnApi.mapObject($scope.allItems, 'ItemId');

      $scope.doSearchInternal();
      $scope.vm.circIdx = myCircIdx;
      $scope.vm.pageIdx = myPageIdx;
    }

    function activate() {
      if ($scope.vm.newCirc) {
        return;
      }

      var config = gsnApi.getConfig();
      if ($scope.currentPath === '/circular' && (gsnApi.isNull(config.defaultMobileListView, null) === null)) {
        config.defaultMobileListView = true;

        var mobileListViewUrl = gsnApi.getThemeConfigDescription('default-mobile-listview');
        if (gsnApi.browser.isMobile && mobileListViewUrl) {
          gsnApi.goUrl(mobileListViewUrl);
          return;
        }
      }

      // broadcast message
      $rootScope.$broadcast('gsnevent:loadads');
      var store = $scope.gvm.currentStore;

      if (!$scope.vm.newCirc || $scope.vm.newCirc.store_number !== store.StoreNumber) {
        // attempt to retrieve store specific circular
        loadServerCircular(store);
        return;
      }

      loadCircular();
    }

    $scope.doAddCircularItem = function(evt, tempItem) {
      var item = $scope.itemsById[tempItem.ItemId];
      if (item) {
        gsnProfile.addItem(item);

        if (gsnApi.isNull(item.Varieties, null) === null) {
          item.Varieties = [];
        }

        $scope.vm.selectedItem = item;
        $scope.gvm.selectedItem = item;
      }
    };

    $scope.currentCircular = function() {
      if (!$scope.vm.newCirc) {
        return null
      }

      return $scope.vm.newCirc.Circulars[$scope.vm.circIdx - 1]
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
      var reverse = (sortBy === $scope.actualSortBy);
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

    $scope.doSearchInternal = function() {
      if (!$scope.vm.newCirc) {
        return;
      }

      var list = gsnProfile.getShoppingList();

      // don't show circular until data and list are both loaded
      if (gsnApi.isNull(list, null) === null) return;

      var circ = $scope.vm.newCirc;
      var searchResult = $filter('filter')($scope.allItems, $scope.vm.filter);
      var sortResult = $filter('orderBy')($filter('filter')(searchResult, $scope.vm.filterBy || ''), $scope.actualSortBy);

      $scope.vm.categories = circ.departments;
      $scope.vm.brands = circ.categories;
      $scope.vm.cacheItems = sortResult;
    };

    $scope.$watch('vm.filterBy', $scope.doSearchInternal);
    $scope.$watch('vm.filter.BrandName', $scope.doSearchInternal);
    $scope.$watch('vm.filter.CategoryName', $scope.doSearchInternal);
    $scope.$watch('vm.pageIdx', setPage);
    $scope.$watch('vm.circIdx', setPage);

    $timeout(activate, 500);

    //#region Internal Methods
    function setPage(oldValue, newValue) {
      if (!$scope.vm.newCirc) return;
      if (!$scope.vm.newCirc.Circulars) return;
      if ($scope.vm.newCirc.Circulars.length <= 0) return;

      $scope.vm.circular = $scope.currentCircular();
      if ($scope.vm.circular) {
        if ($scope.vm.pageIdx < 1) {
          $scope.vm.pageIdx = 1;
          return;
        }

        $scope.vm.pageCount = $scope.vm.circular.Pages.length;
        $scope.vm.page = $scope.vm.circular.Pages[$scope.vm.pageIdx - 1];

        // something went wrong, set to current page
        if (!$scope.vm.page) {
          $scope.vm.pageIdx = 1;
          $scope.vm.page = $scope.vm.circular.Pages[$scope.vm.pageIdx - 1];
        }
      }

      if (oldValue !== newValue) {
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
            label: circ.CircularTypeName
          });
        }
      }
    }

    function loadMore() {
      // do nothing, for backward compat
    }

    //#endregion
  }
})(gsn, angular);
