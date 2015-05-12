(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlCouponClassic';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$timeout', '$analytics', '$filter', 'gsnYoutech', 'gsnCouponPrinter', 'gsnProfile', 'gsnProLogicRewardCard', '$location', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }     

  function myController($scope, gsnStore, gsnApi, $timeout, $analytics, $filter, gsnYoutech, gsnCouponPrinter, gsnProfile, gsnProLogicRewardCard, $location) {
    $scope.activate = activate;
    $scope.addCouponToCard = addCouponToCard;
    $scope.printManufacturerCoupon = printManufacturerCoupon;
    $scope.loadMore = loadMore;

    $scope.isValidProLogic = false;
    $scope.selectedCoupons = {
      items: [],
      targeted: [],
      noCircular: false,
      cardCouponOnly: false,
      totalSavings: 0
    };

    $scope.preSelectedCoupons = {
      items: [],
      targeted: []
    };

    $scope.sortBy = 'EndDate';
    $scope.sortByName = 'About to Expire';
    $scope.filterBy = '';
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
      } else if ($scope.couponType == 'printable') {
        gsnStore.getManufacturerCouponTotalSavings().then(function (rst) {
          $scope.selectedCoupons.totalSavings = parseFloat(rst.response).toFixed(2);
        });

        list.items = manuCoupons.items;
      } else if ($scope.couponType == 'instore') {
        list.items = instoreCoupons.items;
      }
    }

    function activate() {
      loadCoupons();

      // apply filter
      $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterBy), { IsTargeted: false });
      $scope.preSelectedCoupons.items = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.items, $scope.filterBy), $scope.sortBy);
      $scope.preSelectedCoupons.targeted = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.targeted, $scope.filterBy), $scope.sortBy);
      $scope.selectedCoupons.items.length = 0;
      $scope.selectedCoupons.targeted = $scope.preSelectedCoupons.targeted;
      $scope.hasYoutechCoupon = gsnStore.getYoutechCoupons().length;
      loadMore();
    }
    
    function init() {
      isValidProLogicInit();
    }

    function isValidProLogicInit() {
      gsnProfile.getProfile().then(function(p) {
        gsnProLogicRewardCard.getLoyaltyCard(p.response, function(card, isValid) {
          $scope.isValidProLogic = isValid;
        });
      });
    }

    init();
    
    $scope.$on('gsnevent:circular-loaded', function (event, data) {
      if (data.success) {
        $timeout(activate, 500);
        $scope.selectedCoupons.noCircular = false;
      } else {
        $scope.selectedCoupons.noCircular = true;
      }
    });

    $scope.$on('gsnevent:youtech-cardcoupon-loaded', activate);
    $scope.$watch('sortBy', activate);
    $scope.$watch('filterBy', activate);
    $scope.$watch('selectedCoupons.cardCouponOnly', activate);
    $timeout(activate, 500);

    //#region Internal Methods             
    function printManufacturerCoupon(evt, item) {
      gsnCouponPrinter.print([item]);
    }
      
    function addCouponToCard(evt, item) {
      if ($scope.youtech.isAvailable(item.ProductCode)) {
        $scope.youtech.addCouponTocard(item.ProductCode).then(function (rst) {
          if (rst.success) {
            // log coupon add to card
            //var cat = gsnStore.getCategories()[item.CategoryId];
            $analytics.eventTrack('CouponAddToCard', { category: item.ExtCategory, label: item.Description1, value: item.ProductCode });

            $scope.doToggleCartItem(evt, item);
            // apply
            $timeout(function () {
              item.AddCount++;
            }, 50);
          }
        });
      } else {
        // log coupon remove from card
        //var cat = gsnStore.getCategories()[item.CategoryId];
        $analytics.eventTrack('CouponRemoveFromCard', { category: item.ExtCategory, label: item.Description1, value: item.ProductCode });

        $scope.doToggleCartItem(evt, item);
        // apply
        $timeout(function () {
          item.AddCount--;
        }, 50);
      }
    }
    //#endregion
  }

})(angular);