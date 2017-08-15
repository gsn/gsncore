(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnDigitalCirc', ['$timeout', '$rootScope', '$analytics', 'gsnApi', '$location',
    function($timeout, $rootScope, $analytics, gsnApi, $location) {
      // Usage: create classic hovering digital circular
      //
      // Creates: 2013-12-12 TomN
      //
      var directive = {
        restrict: 'EA',
        scope: false,
        link: link
      };
      return directive;

      function link(scope, element, attrs) {
        scope.$watch(attrs.gsnDigitalCirc, function(newValue) {
          if (newValue) {
            if (newValue.Circulars.length > 0) {
              var el = element.find('div');
              var plugin = el.digitalCirc({
                data: newValue,
                browser: gsnApi.browser,
                onItemSelect: function(plug, evt, item) {
                  // must use timeout to sync with UI thread
                  $timeout(function() {
                    $rootScope.$broadcast('gsnevent:digitalcircular-itemselect', item);
                  }, 50);
                },
                onCircularDisplaying: function(plug, circIdx, pageIdx) {
                  // must use timeout to sync with UI thread
                  $timeout(function() {
                    // trigger ad refresh for circular page changed
                    $rootScope.$broadcast('gsnevent:digitalcircular-pagechanging', {
                      plugin: plug,
                      circularIndex: circIdx,
                      pageIndex: pageIdx
                    });
                  }, 50);

                  var circ = plug.getCircular(circIdx);
                  if (circ) {
                    $analytics.eventTrack('PageChange', {
                      category: 'Circular_Type' + circ.CircularTypeId + '_P' + (pageIdx + 1),
                      label: circ.CircularDescription
                    });
                  }

                  return false;
                }
              });
            }
          }
        });
      }
    }
  ]);
})(angular);
