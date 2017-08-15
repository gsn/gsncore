(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnStoreInfo', ['gsnApi', 'gsnStore', '$interpolate', function(gsnApi, gsnStore, $interpolate) {
    // Usage: optimize store info binding for better IE8 support
    //
    // Creates: 2014-01-30 TomN
    //
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      var compiledTemplate = $interpolate(attrs.gsnStoreInfo.replace(/\[+/gi, '{{').replace(/\]+/gi, '}}'));

      function setStoreData() {
        var storeId = gsnApi.isNull(gsnApi.getSelectedStoreId(), 0);
        if (storeId > 0) {
          gsnStore.getStore().then(function(store) {
            if (store) {
              scope.store = store;

              var data = compiledTemplate(scope);

              element.html(data);
            }
          });
        }
      }

      setStoreData();
      scope.$on('gsnevent:store-setid', setStoreData);
    }
  }]);
})(angular);
