(function (angular, Gsn, undefined) {
  'use strict';
  var serviceId = 'gsnDfp';
  angular.module('gsn.core').service(serviceId, ['$rootScope', 'gsnApi', 'gsnStore', 'gsnProfile', '$sessionStorage', '$window', '$timeout', '$location', 'debounce', gsnDfp]);

  function gsnDfp($rootScope, gsnApi, gsnStore, gsnProfile, $sessionStorage, $window, $timeout, $location, debounce) {
    var service = {
      forceRefresh: true,
      actionParam: null,
      doRefresh: debounce(doRefresh, 500)
    };
    var bricktag = $window.bricktag || {
      addDept: function() {},
      refresh: function() {},
      setDefault: function() {}
    };

    function shoppingListItemChange(event, shoppingList, item) {
      var currentListId = gsnApi.getShoppingListId();
      if (shoppingList.ShoppingListId == currentListId) {
        var cat = gsnStore.getCategories()[item.CategoryId];
        bricktag.addDept(cat.CategoryName);
        // service.actionParam = {evtname: event.name, dept: cat.CategoryName, pdesc: item.Description, pcode: item.Id, brand: item.BrandName};
        service.doRefresh();
      }
    }
    
    $rootScope.$on('gsnevent:shoppinglistitem-updating', shoppingListItemChange);
    $rootScope.$on('gsnevent:shoppinglistitem-removing', shoppingListItemChange);
    $rootScope.$on('gsnevent:shoppinglist-loaded', function (event, shoppingList, item) {
      var list = gsnProfile.getShoppingList();
      if (list) {
        // load all the ad depts
        var items = gsnProfile.getShoppingList().allItems();
        var categories = gsnStore.getCategories();

        angular.forEach(items, function (item, idx) {
          if (gsnApi.isNull(item.CategoryId, null) === null) return;

          if (categories[item.CategoryId]) {
            var newKw = categories[item.CategoryId].CategoryName;
            bricktag.addDept(newKw);
          }
        });

        // service.actionParam = {evtname: event.name, evtcategory: gsnProfile.getShoppingListId() };
      }
    });

    $rootScope.$on('$locationChangeSuccess', function (event, next) {
      var currentPath = angular.lowercase(gsnApi.isNull($location.path(), ''));
      gsnProfile.getProfile().then(function(p){
        var isLoggedIn = gsnApi.isLoggedIn();

        bricktag.setDefault({ 
          page: currentPath, 
          storeid: gsnApi.getSelectedStoreId(), 
          consumerid: gsnProfile.getProfileId(), 
          isanon: !isLoggedIn,
          loyaltyid: p.response.ExternalId
        });
      });
      service.forceRefresh = true;
      service.doRefresh();
    });

    $rootScope.$on('gsnevent:loadads', function (event, next) {
      service.actionParam = {evtname: event.name};
      service.doRefresh();
    });

    $rootScope.$on('gsnevent:digitalcircular-pagechanging', function (event, data) {
      // service.actionParam = {evtname: event.name, evtcategory: data.circularIndex, pdesc: data.pageIndex};
      service.doRefresh();
    });

    init();

    return service;

    // initialization
    function init() {
      if (service.isIE) {
        bricktag.minSecondBetweenRefresh = 15;
      }
    }

    // refresh method
    function doRefresh() {
      ($rootScope.gvm || {}).adsCollapsed = false;
      bricktag.refresh(service.actionParam, service.forceRefresh);
      service.forceRefresh = false;
    }
  }
})(angular, window.Gsn);

