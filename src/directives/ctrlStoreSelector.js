( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlStoreSelector';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnApi', '$notification', '$timeout', '$rootScope', '$location', 'gsnStore', 'debounce', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnApi, $notification, $timeout, $rootScope, $location, gsnStore, debounce ) {
    $scope.activate = activate;
    $scope.vm = {
      storeList: [],
      currentStore: null,
      myIP: null,
      stores: null
    };

    function doFilter() {
      // wait for storeList
      if ( $scope.vm.storeList.length <= 0 ) {
        return;
      }

      if ( typeof ( Wu ) !== 'undefined' ) {
        var wu = new Wu();
        var myFn = wu.geoOrderByIP;
        var origin = $scope.vm.myIP || ( '//cdn2.brickinc.net/geoipme/?cb=' + ( new Date().getTime() ) );

        if ( $scope.vm.myIP ) {
          myFn = wu.geoOrderByOrigin;
        }

        myFn.apply( wu, [ $scope.vm.storeList, origin, function ( rst ) {
          $timeout( function () {
            $scope.vm.myIP = rst.origin;
            $scope.vm.stores = rst.results;
          }, 200 );
        } ] );
      }
    }

    function activate() {
      // do nothing
      if ( $scope.useBrowserGeo ) {
        // Getting User's Location Using HTML 5 Geolocation API
        if ( navigator.geolocation ) {
          navigator.geolocation.getCurrentPosition( function ( position ) {
            $scope.vm.myIP = position.coords;
            doFilter();
          }, function ( err ) {
            // do nothing as geoip is done by default
          }, {
            maximumAge: 60000,
            timeout: 5000,
            enableHighAccuracy: true
          } );
          return;
        }
      }
    }

    gsnStore.getStores().then( function ( rsp ) {
      var storeList = rsp.response;
      $scope.vm.storeList = storeList;
      doFilter();
    } );

    gsnStore.getStore().then( function ( store ) {
      if ( store ) {
        $scope.vm.currentStore = store;
      }
    } );

    $scope.selectStore = function ( storeId ) {
      var currentStore = $scope.vm.currentStore || {};
      if ( !storeId || ( currentStore.StoreId === storeId ) ) {
        return;
      }

      $scope.gvm.reloadOnStoreSelection = true;
      gsnApi.setSelectedStoreId( storeId );
    };

    $scope.$on( 'gsnevent:store-persisted', function ( evt, store ) {
      if ( $scope.gvm.reloadOnStoreSelection ) {
        $scope.goUrl( $scope.currentPath, '_reload' );
      }
    } );
    $scope.activate();
  }

} )( angular );
