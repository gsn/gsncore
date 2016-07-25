(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  var myDirectiveName = 'ctrlCouponRoundy';

  angular.module('gsn.core')
    .controller(myDirectiveName,  ['$scope', 'gsnStore', 'gsnApi', '$timeout', '$analytics', '$filter',  'gsnYoutech', 'gsnProfile', '$location', 'gsnCouponPrinter', 'gsnRoundyProfile', 'gsnList', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi, $timeout, $analytics, $filter, gsnYoutech, gsnProfile, $location, gsnCouponPrinter, gsnRoundyProfile, gsnList) {
    $scope.activate = activate;
    $scope.addCouponToCard = addCouponToCard;
    $scope.printManufacturerCoupon = printManufacturerCoupon;
    $scope.printClippedCoupons = printClippedCoupons;
	  $scope.showPrint = showPrint;
    $scope.loadMore = loadMore;
    $scope.clipCoupon = clipCoupon;
    $scope.isOnClippedList = isOnClippedList;
    $scope.addClippedToList = addClippedToList;
    $scope.getClippedSavedAmount = getClippedSavedAmount;
    $scope.countClippedCoupons = countClippedCoupons;
    $scope.getPercentOfClipped = getPercentOfClipped;
    $scope.changeFilter = changeFilter;
    $scope.unclipCoupon = unclipCoupon;
    $scope.preClipCoupon = preClipCoupon;
    $scope.departments = [];
    $scope.couponsPrinted = [];
    $scope.selectedCoupons = {
      items: [],
      targeted: [],
      noCircular: false,
      cardCouponOnly: false,
      printedCouponOnly: false,
      clippedCouponOnly: false,
      totalSavings: 0,
      isFailedLoading: false
    };
    $scope.gcprinter = gcprinter;
    $scope.printer = { blocked: 0, notsupported: 0, notinstalled: 0, printed: null, count: 0, total: 0, isChrome: /chrome/gi.test(gsnApi.userAgent) };
    $scope.preSelectedCoupons = {
      items: [],
      targeted: []
    };

    $scope.clippedCount = 0;
    $scope.clippedCoupons = {};
    $scope.sortBy = 'EndDate';
    $scope.sortByName = 'About to Expire';
    $scope.filterByComplex = '';
    $scope.filterBy = $location.search().q;
    $scope.filterIds = $location.search().ids;
    $scope.couponType = $scope.couponType || 'digital';  // 'digital', 'printable', 'instore'
    $scope.itemsPerPage = ($location.search()).itemsperpage || ($location.search()).itemsPerPage || $scope.itemsPerPage || 20;

    function loadMore() {
      var items = $scope.preSelectedCoupons.items || [];
      if (items.length > 0) {
        var last = $scope.selectedCoupons.items.length - 1;
        for (var i = 1; i <= $scope.itemsPerPage; i++) {
          var item = items[last + i];
          if (item) {
            $scope.selectedCoupons.items.push(item);
          }
        }
      }
    }

    function loadCoupons() {
      var manuCoupons = gsnStore.getManufacturerCoupons(),
          youtechCouponsOriginal = gsnStore.getYoutechCoupons(),
          instoreCoupons = gsnStore.getInstoreCoupons();

      if ($scope.couponType == 'printable') {
        gsnCouponPrinter.init();
      }

      preprocessCoupons(manuCoupons, youtechCouponsOriginal, instoreCoupons);
    }

    function preprocessCoupons(manuCoupons, youtechCouponsOriginal, instoreCoupons) {

      if (!$scope.preSelectedCoupons.items) {
        $scope.preSelectedCoupons = {
          items: [],
          targeted: []
        };
      }

      $scope.preSelectedCoupons.items.length = 0;
      $scope.preSelectedCoupons.targeted.length = 0;
      var list = $scope.preSelectedCoupons;

      if ($scope.couponType == 'digital') {
        var totalSavings = 0.0;
        if (!$scope.selectedCoupons.clippedCouponOnly) {
          angular.forEach(youtechCouponsOriginal.items, function (item) {
            if (!$scope.selectedCoupons.cardCouponOnly || !gsnYoutech.isAvailable(item.ProductCode)) {
              if (gsnYoutech.isValidCoupon(item.ProductCode)) {
                item.AddCount = 1;
                list.items.push(item);
                if (item.IsTargeted) {
                  list.targeted.push(item);
                }

                totalSavings += gsnApi.isNaN(parseFloat(item.TopTagLine), 0);
              }
            }
          });

          $scope.selectedCoupons.totalSavings = totalSavings.toFixed(2);
        } else {
          angular.forEach(youtechCouponsOriginal.items, function (item) {
            if ((!$scope.selectedCoupons.cardCouponOnly || !gsnYoutech.isAvailable(item.ProductCode)) && isOnClippedList(item)) {
              if (gsnYoutech.isValidCoupon(item.ProductCode)) {
                item.AddCount = 1;
                list.items.push(item);
                totalSavings += gsnApi.isNaN(parseFloat(item.TopTagLine), 0);
              }
            }
          });
        }
      } else if ($scope.couponType == 'printable') {
        gsnStore.getManufacturerCouponTotalSavings().then(function (rst) {
          $scope.selectedCoupons.totalSavings = parseFloat(rst.response).toFixed(2);
        });
        var printed = gsnProfile.getPrintedCoupons();
        if ($scope.selectedCoupons.printedCouponOnly) {
          angular.forEach(manuCoupons.items, function (item) {
            if (printed && printed.indexOf(item.ProductCode) >= 0)
              list.items.push(item);
          });
        } else {
          angular.forEach(manuCoupons.items, function (item) {
            if ($scope.couponsPrinted.indexOf(item.ProductCode) >= 0)
              item.isPrint = true;
          });
          if (manuCoupons.items)
            list.items = manuCoupons.items;
        }
      } else if ($scope.couponType == 'instore') {
        list.items = instoreCoupons.items;
      }
    }

    function filterByIds(item) {
      var ids = $scope.filterIds.split(',');
      return ids.indexOf(item.Id + '') >= 0;
    }

    function activate() {
      loadCoupons();

      //loading departments
      $scope.departments = [];

      //Departments for digital coupons
      $scope.extDepartments = [];
      var grouppedByExtCategory = gsnApi.groupBy($scope.preSelectedCoupons.items, 'ExtCategory');
      angular.forEach(grouppedByExtCategory, function (item) {
        $scope.extDepartments.push(item.key);
      });

      //brands
      $scope.brands = [];
      var grouppedByBrands = gsnApi.groupBy($scope.preSelectedCoupons.items, 'BrandName');
      angular.forEach(grouppedByBrands, function (item) {
        $scope.brands.push({ key: item.key.replace(/'/g, "&#39;"), value: decodeURI(item.key) });
      });

      for (var key in $scope.filterByComplex) {
        var value = $scope.filterByComplex[key];
        if (typeof value == 'string' || value instanceof String) {
          $scope.filterByComplex[key] = value.replace(/&#39;/g, "'");
        }
      }

      var isTargetEnable = ($scope.filterByComplex.length !== "" || gsn.config.DisableLimitedTimeCoupons) ? null : { IsTargeted: false };

      if ($scope.filterIds) {
        $scope.preSelectedCoupons.items = $filter('filter')($scope.preSelectedCoupons.items, filterByIds);
      }

      // apply filter
      $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterBy), isTargetEnable);
      $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterByComplex), isTargetEnable);
      $scope.preSelectedCoupons.items = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterBy), $scope.sortBy);
      $scope.preSelectedCoupons.targeted = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.targeted, $scope.filterBy), $scope.sortBy);


      $scope.selectedCoupons.items.length = 0;

      if (!gsn.config.DisableLimitedTimeCoupons)
        $scope.selectedCoupons.targeted = $scope.preSelectedCoupons.targeted;
      if ($scope.filterByComplex.length !== "")
        $scope.selectedCoupons.targeted = [];
      loadMore();
      loadClippedCoupons();
      synchWirhErrors();
    }

    $scope.$on('gsnevent:circular-loaded', function (event, data) {
      if (data.success) {
        $timeout(function () {
          activate();
        }, 500);
        $scope.selectedCoupons.noCircular = false;
      } else {
        $scope.selectedCoupons.noCircular = true;
      }
    });

    $scope.$on('gsnevent:youtech-cardcoupon-loaded', activate);
    $scope.$on('gsnevent:youtech-cardcoupon-loadfail', function () {
      $scope.selectedCoupons.isFailedLoading = true;
    });
    $scope.$watch('sortBy', activate);
    $scope.$watch('filterBy', activate);
    $scope.$watch('selectedCoupons.cardCouponOnly', activate);
    $scope.$watch('selectedCoupons.clippedCouponOnly', activate);
    $scope.$watch('selectedCoupons.printedCouponOnly', activate);
    $scope.$watch('filterByComplex', activate);
    $timeout(activate, 500);

    //#region Internal Methods
    function printManufacturerCoupon(evt, item) {
      gsnCouponPrinter.print([item]);
    }

    function synchWirhErrors() {
      if ($scope.printer.errors) {
        angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
          var found = $filter('filter')($scope.printer.errors, { CouponId: coupon.ProductCode });
          if (found.length > 0) {
            unclipCoupon(coupon);
            coupon.ErrorMessage = found[0].ErrorMessage;
          }
        });
      }
    }

    // trigger modal
    $scope.$on('gsnevent:gcprinter-not-supported', function() {
      $scope.printer.notsupported++;
    });
    $scope.$on('gsnevent:gcprinter-blocked', function() {
      $scope.printer.blocked++;
    });
    $scope.$on('gsnevent:gcprinter-not-found', function() {
      $scope.printer.notinstalled++;
    });
    $scope.$on('gsnevent:gcprinter-initcomplete', function() {
      $scope.gcprinter = gcprinter;
      $scope.printer.gcprinter = gcprinter;
    });
    $scope.$on('gsnevent:gcprinter-printed', function(evt, e, rsp) {
      $scope.printer.printed = e;
      if (rsp) {
        $scope.printer.errors = gsnApi.isNull(rsp.ErrorCoupons, []);
        var count = $scope.printer.total - $scope.printer.errors.length;
        if (count > 0) {
          $scope.printer.count = count;
        }
		    $scope.printer.total = 0;
      }
    });

  	function showPrint() {
  	  $scope.printer.printed = null;
  	  var clippedCouponsInArr = [];
  	  for(var key in $scope.clippedCoupons){
  	    clippedCouponsInArr.push($scope.clippedCoupons[key]);
  	  }
  	  $scope.printer.total = clippedCouponsInArr.length;
  	}

    function printClippedCoupons() {
	    var clippedCouponsInArr = [];
      for(var key in $scope.clippedCoupons){
        clippedCouponsInArr.push($scope.clippedCoupons[key]);
      }
      gsnCouponPrinter.print(clippedCouponsInArr);
      $scope.$emit('gsnevent:closemodal');
    }

    function addCouponToCard(evt, item) {
      if ($scope.youtech.isAvailable(item.ProductCode)) {
        $scope.youtech.addCouponTocard(item.ProductCode).then(function (rst) {
          if (rst.success) {
            // log coupon add to card
            //var cat = gsnStore.getCategories()[item.CategoryId];
            $analytics.eventTrack('CouponAddToCard', { category: item.ExtCategory, label: item.Description, item: item });

            $scope.clippedCoupons[item.ProductCode] = item;
            // apply
            $timeout(function () {
              item.AddCount++;
            }, 50);
          }
        });

    		// if coupon has SubCategory, add to the Roundy's card
    		if(gsnApi.isNull(item.SubCategory, '') != '') {
    		  gsnRoundyProfile.addOffer(item.SubCategory);
        }
      } else {
        // log coupon remove from card
        //var cat = gsnStore.getCategories()[item.CategoryId];
        $analytics.eventTrack('CouponRemoveFromCard', { category: item.ExtCategory, label: item.Description, item: item });

        // apply
        $timeout(function () {
          item.AddCount--;
        }, 50);
      }
    }

    function clipCoupon(item) {
      item.isPrint = false;
      item.ErrorMessage = null;
      if (!$scope.clippedCoupons[item.ProductCode]) {
        $scope.clippedCoupons[item.ProductCode] = item;
        gsnProfile.clipCoupon(item.ProductCode);
      }

      $analytics.eventTrack('CouponClip',
        { category: item.ExtCategory,
          label: item.Description,
          item: item });

      countClippedCoupons();
    }

    function preClipCoupon(item) {
      gsnProfile.savePreclippedCoupon(item);
    }

    function unclipCoupon(item) {
      if ($scope.clippedCoupons[item.ProductCode]) {
        $scope.clippedCoupons = gsnApi.del($scope.clippedCoupons, item.ProductCode);
        gsnProfile.unclipCoupon(item.ProductCode);
      }
      countClippedCoupons();
    }

    function isOnClippedList(item) {
      return gsnApi.isNull($scope.clippedCoupons[item.ProductCode], null) !== null;
    }

    function countClippedCoupons() {
      $scope.clippedCount = gsnApi.keys($scope.clippedCoupons).length;
      return $scope.clippedCount;
    }

    function addClippedToList() {
      var items = [];
      for (var key in $scope.clippedCoupons) {
        if (!isNaN(parseInt(key))) {
          var coupon = $scope.clippedCoupons[key];
          if (!gsnProfile.isOnList(coupon)) {
            items.push(coupon;)
          }
        }
      }

      if (items.length > 0) {
        gsnList.addItems(items);
      }
    }

    function addClippedToListBak() {
      for (var key in $scope.clippedCoupons) {
        if (!isNaN(parseInt(key))) {
          var coupon = $scope.clippedCoupons[key];
          $scope.doToggleCartItem(null, coupon);
        }
      }
    }

    function getClippedSavedAmount() {
      var saved = 0;
      for (var key in $scope.clippedCoupons) {
        if (!isNaN(parseInt(key))) {
          var coupon = $scope.clippedCoupons[key];

  		    if(coupon != null) {
            var saving = parseFloat(coupon.SavingsAmount);
            if (saving < 11) {
              saved += saving;
            }
          }
        }
      }
      return saved.toFixed(2);
    }

    function getPercentOfClipped() {
      var result = getClippedSavedAmount() / $scope.selectedCoupons.totalSavings * 100;
      if (!result)
        result = 0;
      return { width: result + '%' };
    }

    function loadClippedCoupons() {
      if ($scope.couponType == 'digital') {

        angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
          if (!isOnClippedList(coupon) && gsnYoutech.isOnCard(coupon.ProductCode)) {
            $scope.clippedCoupons[coupon.ProductCode] = coupon;
          }
        });
        angular.forEach($scope.preSelectedCoupons.targeted, function (coupon) {
          if (!isOnClippedList(coupon) && gsnYoutech.isOnCard(coupon.ProductCode)) {
            $scope.clippedCoupons[coupon.ProductCode] = coupon;
          }
        });

        var preclipped = gsnProfile.getPreclippedCoupon();
        if (preclipped)
          if (!isOnClippedList(preclipped) && gsnYoutech.hasValidCard())
            addCouponToCard(null, preclipped);
      } else {
        var clippedIds = gsnProfile.getClippedCoupons();

        angular.forEach($scope.preSelectedCoupons.items, function (coupon) {
          angular.forEach(clippedIds, function (id) {
            if (id == coupon.ProductCode && !isOnClippedList(coupon)) {
              $scope.clippedCoupons[coupon.ProductCode] = coupon;
            }
          });
        });
      }
      countClippedCoupons();
    }

    function changeFilter(newfilter, sortByName) {
      $scope.filterByComplex = newfilter;
      $scope.sortByName = sortByName;
    }

    //#endregion
  }
})(angular);
