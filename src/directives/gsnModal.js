(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnModal', ['$compile', '$timeout', '$location', '$http', '$templateCache', '$rootScope', 'gsnApi', '$window', function($compile, $timeout, $location, $http, $templateCache, $rootScope, gsnApi, $window) {

    /***
     * simple directive
     * @type {Object}
     */
    var directive = {
      link: link,
      scope: true,
      restrict: 'AE'
    };
    return directive;

    function link(scope, element, attrs) {
      var myHtml, templateLoader, tplURL, track, hideCb, startTime, endTime, timeoutOfOpen;
      tplURL = scope.$eval(attrs.gsnModal);
      scope.$location = $location;
      myHtml = '';
      templateLoader = $http.get(tplURL, {
        cache: $templateCache
      }).success(function(html) {
        myHtml = '<div class="myModalForm" style="display: block"><div class="modal-dialog">' + html + '</div></div>"';
        return myHtml;
      });
      if (attrs.track) {
        track = scope.$eval(attrs.track);
      }
      hideCb = scope.$eval(attrs.hideCb);

      function hideCallback() {
        endTime = new Date();
        if (track) {
          if (!track.property)
            track.property = endTime.getTime() - startTime.getTime();

          $rootScope.$broadcast('gsnevent:gsnmodal-hide', element, track);
          if (typeof(hideCb) === 'function') {
            hideCb();
          }
        }
      }

      scope.closeModal = function(shouldReload) {
        if (timeoutOfOpen)
          $timeout.cancel(timeoutOfOpen);
        if (shouldReload !== undefined && shouldReload)
          window.top.location.reload();
        return gmodal.hide();
      };

      scope.openModal = function(e) {
        $rootScope.$broadcast('gsnevent:gsnmodal-show', element, track);
        startTime = new Date();
        if (e) {
          if (e.preventDefault) {
            e.preventDefault();
          }
        }
        var forceShow = false;
        if (attrs.forceShow) {
          forceShow = true;
        }

        if (!gmodal.isVisible || forceShow) {
          if (attrs.item) {
            scope.item = scope.$eval(attrs.item);
          }
          templateLoader.then(function() {
            var $modalElement = angular.element($compile(myHtml)(scope));
            return gmodal.show({
              content: $modalElement[0],
              hideOn: attrs.hideOn || 'click,esc,tap',
              cls: attrs.cls,
              timeout: attrs.timeout,
              closeCls: attrs.closeCls || 'close modal',
              disableScrollTop: attrs.disableScrollTop
            }, hideCallback);
          });
        }
        return scope;
      };
      scope.hideModal = scope.closeModal;
      scope.showModal = scope.openModal;

      scope.goUrl = function(url, target) {
        if (gsnApi.isNull(target, '') === '_blank') {
          $window.open(url, '');
          return;
        }

        $location.url(url);
        scope.closeModal();
      };

      if (attrs.showIf) {
        scope.$watch(attrs.showIf, function(newValue) {
          if (newValue > 0) {
            timeoutOfOpen = $timeout(scope.openModal, 1550);
          }
        });
      }

      if (attrs.show) {
        scope.$watch(attrs.show, function(newValue) {
          if (newValue) {
            timeoutOfOpen = $timeout(scope.openModal, 550);
          } else {
            $timeout(scope.closeModal, 550);
          }
        });
      }

      if (attrs.eventToClose) {
        scope.$on(attrs.eventToClose, function() {
          $timeout(scope.closeModal, 5);
        });
      }
    };
  }]);
})(angular);
