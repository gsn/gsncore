(function(angular, undefined) {
  'use strict';
  var serviceId = 'gsnCouponPrinter';
  angular.module('gsn.core').service(serviceId, ['$rootScope', 'gsnApi', '$log', '$timeout', 'gsnStore', 'gsnProfile', '$window', gsnCouponPrinter]);

  function gsnCouponPrinter($rootScope, gsnApi, $log, $timeout, gsnStore, gsnProfile, $window) {
    var service = {
      print: print,
      init: init,
      loadingScript: false,
      isScriptReady: false,
      activated: false,
      isDetecting: false,
      pluginFound: false
    };
    var couponClasses = [];
    var coupons = [];

	activate();
	
	$rootScope.$on('gsnevent:circular-loaded', function(event, data) {
      if (!service.activated) activate();
    });    

    return service;

    function activate() {
      if (!gsnApi.getConfig().hasPrintableCoupon) {
        return;
      }

      if (typeof (gcprinter) == 'undefined') {
        $log.log('waiting for gcprinter...');
        $timeout(activate, 500);

        if (service.loadingScript) return;

        service.loadingScript = true;

        // dynamically load google
        var src = '//cdn.gsngrocers.com/script/gcprinter/gcprinter.min.js';

        gsnApi.loadScripts([src], activate);
        return;
      }

      if (service.activated) return;
      service.activated = true

      gcprinter.on('printed', function(e, rsp) {
        $timeout(function() {
          // process coupon error message
          var errors = gsnApi.isNull(rsp.ErrorCoupons, []);
          if (errors.length > 0) {
            angular.forEach(errors, function(item) {
              angular.element('.coupon-message-' + item.CouponId).html(item.ErrorMessage);
            });
          }
          $rootScope.$broadcast('gsnevent:gcprinter-printed', e, rsp);
        }, 5);
      });

      gcprinter.on('printing', function(e) {
        $timeout(function() {
          angular.element(couponClasses.join(',')).html('Printing...');
          $rootScope.$broadcast('gsnevent:gcprinter-printing', e);
        }, 5);
      });

      gcprinter.on('printfail', function(e, rsp) {
        $timeout(function() {
          if (e == 'gsn-server') {
            angular.element(couponClasses.join(',')).html('Print limit reached...');
          } else if (e == 'gsn-cancel') {
            angular.element(couponClasses.join(',')).html('Print canceled...');
          } else {
            angular.element(couponClasses.join(',')).html('Print failed...');
          }
          $rootScope.$broadcast('gsnevent:gcprinter-printfail', rsp);
        }, 5);
      });

      // keep trying to init until ready
      gcprinter.on('initcomplete', function() {
        service.isScriptReady = true;
        init();
        $rootScope.$broadcast('gsnevent:gcprinter-initcomplete');
      });
      return;
    }

    function init() {
      if (!gsnApi.getConfig().hasPrintableCoupon) {
        return;
      }

      // do not need coupon printer for mobile
      if (gsnApi.isMobile) {
        return;
      }

      if (typeof (gcprinter) === 'undefined') {
        $timeout(init, 500);
        return;
      }

      if (!service.isScriptReady) {
        gcprinter.init();
        return;
      }

      $timeout(printInternal, 5);
    }

    function print(items) {
      if ((items || []).length <= 0) {
        return;
      }

      if (gsnStore.getProcessDate() == 0) {
        // wait until all coupons has been processed
        $timeout(function() {
          print(items);
          return;
        }, 1000);
        return;
      }

      coupons.length = 0;
      couponClasses.length = 0;
      angular.forEach(items, function(v, k) {
        if (gsnApi.isNull(v, null) === null) {
          return;
        }

        var item = v;
        if (gsnApi.isNull(v.ProductCode, null) === null) {
          item = gsnStore.getCoupon(v.ItemId, v.ItemTypeId) || v;
        }

        couponClasses.push('.coupon-message-' + item.ProductCode);
        coupons.push(item.ProductCode);
      });

      $timeout(function() {
        angular.element(couponClasses.join(',')).html('Checking, please wait...');
      }, 5);

      if (!gcprinter.isReady) {
        // call to trigger printer init
        init();
        return;
      }

      $timeout(printInternal, 5);
    }

    function printInternal() {
      if (!isPluginInstalled()) {
        $rootScope.$broadcast('gsnevent:gcprinter-not-found');

        if (!service.isDetecting) {
          service.isDetecting = true;
          continousDetect();
        }
      } else if (gcprinter.isPluginBlocked()) {
        $rootScope.$broadcast('gsnevent:gcprinter-blocked');
      } else if (!isPrinterSupported()) {
        $rootScope.$broadcast('gsnevent:gcprinter-not-supported');
      } else if (coupons.length > 0) {
        var siteId = gsnApi.getChainId();
        angular.forEach(coupons, function(v) {
          gsnProfile.addPrinted(v);
        });
        gcprinter.print(siteId, coupons);
      }
    }
    ;

    // continously checks plugin to detect when it's installed
    function continousDetect() {
      if (isPluginInstalled()) {
        pluginSuccess();
        return;
      }

      if (gcprinter.isChrome) {
        gcprinter.checkInstall(pluginSuccess, continousDetect);
      } else {
        // use faster checkInstall method for non-chrome
        setTimeout(function() {
          gcprinter.checkInstall(continousDetect, continousDetect);
        }, 2000);
      }
    }
    ;

    function pluginSuccess() {
      // force init
      service.pluginFound = true;

      $timeout(function() {
        $rootScope.$broadcast('gsnevent:gcprinter-ready');
      }, 5);

      gcprinter.init(true);
    }
    ;

    function isPluginInstalled() {
      if (gcprinter.isChrome) {
        return service.pluginFound;
      }

      return gcprinter.hasPlugin();
    }
    ;

    function isPrinterSupported() {
      var result = false;
      try {
        result = gcprinter.isPrinterSupported();
      } catch (e) {
        result = true;
      }
      return result;
    }
    ;
  } // end service function
})(angular);