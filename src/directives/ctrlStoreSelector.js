(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlStoreSelector';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnApi', '$notification', '$timeout', '$rootScope', '$location', 'gsnStore', 'debounce', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnApi, $notification, $timeout, $rootScope, $location, gsnStore, debounce) {
    $scope.activate = activate;
    $scope.vm = {
      storeList: null,
      currentStore: null,
      myIP: null,
      stores: null,
      selectedOption: '0'
    };

    gsnStore.getStores().then(function(rsp) {
      var storeList = rsp.response;
      $scope.vm.storeList = storeList;
      if (typeof (Wu) !== 'undefined') {
        var wu = new Wu();
        var myFn = wu.geoOrderByIP;
        var origin = $scope.vm.myIP;

        if (origin) {
          myFn = wu.geoOrderByOrigin;
        }

        myFn.apply(wu, [storeList, origin, function(rst) {
          $timeout(function() {
            $scope.vm.myIP = rst.origin;
            $scope.vm.stores = rst.results;
          }, 200);
        }]);
      }
    });

    gsnStore.getStore().then(function(store) {
      $scope.vm.currentStore = store;
    });

    function activate() {
      // do nothing
    }

    $scope.selectStore = function(store, reload) {
      gsnApi.setSelectedStoreId(store.StoreId);
      // cause a reload
    };

    $scope.$watch('vm.selectedOption', function(newValue, oldValue) {
      if (!newValue) return;

      if ((newValue + '').indexOf('/') >= 0) {
        gsnApi.goUrl(newValue);
        return;
      }

      gsnApi.setSelectedStoreId(newValue);
      $scope.vm.selectedOption = '';
    });
    $scope.activate();
  }

})(angular);
