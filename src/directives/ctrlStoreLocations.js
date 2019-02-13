
(function(angular, L, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlStoreLocations';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', '$compile', 'gsnApi', '$notification', '$timeout', '$rootScope', '$location', 'gsnStore', 'debounce', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, $compile, gsnApi, $notification, $timeout, $rootScope, $location, gsnStore, debounce) {
    var defaultZoom = $scope.defaultZoom || 6;

    $scope.fromUrl = $location.search().fromUrl;
    $scope.myMarkers = [];
    $scope.currentMarker = null;
    $scope.storeList = [];
    $scope.currentStoreId = gsnApi.getSelectedStoreId();
    $scope.storeByNumber = {};
    $scope.vmsl = {
      myMarkerGrouping: []
    };
    $scope.map = L.map('map_canvas', {
      center: [49.38, -66.94],
      minZoom: 2,
      zoom: defaultZoom
    });
    $scope.myIcon = L.icon({
        iconUrl: 'https://cdn.brickinc.net/asset/common/images/pin24.png',
        iconRetinaUrl: 'https://cdn.brickinc.net/asset/common/images/pin48.png',
        iconSize: [29, 24],
        iconAnchor: [9, 21],
        popupAnchor: [0, -14]
      });
    $scope.popMarker = null;
    $scope.bounds = [];

    L.tileLayer( 'https://upload.brickinc.net/osm/{s}/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: ['a', 'b', 'c']
    }).addTo( $scope.map )

    gsnStore.getStores().then(function(rsp) {
      var storeList = rsp.response;
      var storeNumber = $scope.storeNumber || $scope.currentPath.replace(/\D*/, '');
      var storeUrl = '';
      if ($scope.currentPath.indexOf('/store/') >= 0) {
        storeUrl = $scope.currentPath.replace('/store/', '').replace(/[^a-z-]*/g, '');
      }

      $scope.storeByNumber = gsnApi.mapObject(storeList, 'StoreNumber');
      var store = $scope.storeByNumber[storeNumber];

      if (storeUrl.length > 0) {
        $scope.storeByUrl = gsnApi.mapObject(storeList, 'StoreUrl');
        store = $scope.storeByUrl[storeUrl];
      }

      if (store) {
        $scope.storeList = [store];
      } else if (storeNumber.length > 0 || storeUrl.length > 0) {
        // store not found when either storeNumber or storeUrl is valid
        gsnApi.goUrl('/404');
      } else {
        $scope.storeList = rsp.response;
      }
      if ($scope.storeList.length <= 1 && $scope.singleStoreRedirect) {
        gsnApi.goUrl($scope.singleStoreRedirect + '/' + $scope.storeList[0].StoreNumber);
      }

      $scope.initializeMarker(storeList);

      var markers = $scope.myMarkers;
      for ( var i=0; i < markers.length; ++i )
      {
        var marker = markers[i];
        var html = "<div class=\"infoMarker\"><strong>" + marker.location.StoreName +
          "</strong><br><address>" +
          marker.location.PrimaryAddress +
          "<br>" +
          marker.location.City +
          ", " +
          marker.location.StateName +
          " " +
          marker.location.PostalCode +
          "</address><div><a class=\"btn btn-default btn-xs\" href=\"/?storenbr=" +
          marker.location.StoreNumber +
          "\">Select Store</a><br><a href=\"https://maps.google.com?saddr=Current+Location&daddr=" +
          marker.location.Latitude + "," + marker.location.Longitude +"\" target=\"_blank\" style=\"font-weight: bold; text-decoration: underline;\">Get Directions</a></div></div>";

        L.marker( [markers[i].location.Latitude, markers[i].location.Longitude], {icon: $scope.myIcon} )
          .bindPopup( html )
          .addTo( $scope.map );

        $scope.bounds.push([markers[i].location.Latitude, markers[i].location.Longitude])
      }
      var bounds = new L.LatLngBounds($scope.bounds);
      $scope.map.fitBounds(bounds);
    });

    gsnStore.getStore().then(function(store) {
      var show = gsnApi.isNull($location.search().show, '');
      if (show === 'event') {
        if (store) {
          $location.url($scope.decodeServerUrl(store.Redirect));
        }
      }
    });

    $scope.isCurrentStore = function(marker) {
      if (!marker) return false;

      return gsnApi.isNull($scope.currentStoreId, 0) === marker.location.StoreId;
    };

    $scope.initializeMarker = function(stores) {
      $scope.currentMarker = null;

      var data = stores || [];
      var tempMarkers = [];
      var endIndex = data.length;

      // here we test with setting a limit on number of stores to show
      // if (endIndex > 10) endIndex = 10;

      for (var i = 0; i < endIndex; i++) {
        var newMarker = { location: data[i], SortBy: data[i].SortBy };
        tempMarkers.push(newMarker);
      }

      if (i === 1) {
        $scope.currentMarker = tempMarkers[i];
      }

      if ($scope.myMarkers.length > 0) {
        $scope.fitAllMarkers();
      }

      $scope.myMarkers = tempMarkers;
      $scope.vmsl.myMarkerGrouping = gsnApi.groupBy($scope.myMarkers, 'SortBy');
    };

    $scope.viewSpecials = function(marker) {
      gsnApi.setSelectedStoreId(marker.location.StoreId, '/circular');
    };

    $scope.selectStore = function(marker, reload) {
      $scope.gvm.reloadOnStoreSelection = reload;
      if (gsnApi.isNull($location.search().show, '') === 'event') {
        gsnApi.setSelectedStoreId(marker.location.StoreId, $scope.decodeServerUrl(marker.location.Redirect));
      } else if (gsnApi.isNull($location.search().fromUrl, '').length > 0) {
        gsnApi.setSelectedStoreId(marker.location.StoreId, $location.search().fromUrl);
      }
      else {
        gsnApi.setSelectedStoreId(marker.location.StoreId,'/');
      }
    };

    $scope.$on('gsnevent:storelist-loaded', function(event, data) {
      gsnApi.reload();
    });

    $scope.$on('gsnevent:store-setid', function(event, result) {
      $scope.currentStoreId = gsnApi.getSelectedStoreId();

      $timeout(function() {
        // cause a reload
        if ($scope.gvm.reloadOnStoreSelection) {
          $scope.gvm.reloadOnStoreSelection = false;
          $scope.goUrl($scope.currentPath, '_reload');
        }
      }, 500);
    });
  }

})(angular, L);
