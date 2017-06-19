(function (angular, undefined) {
    'use strict';
    var myDirectiveName = 'ctrlCouponClassic';
    angular.module('gsn.core').controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$timeout', '$analytics', '$filter', 'gsnYoutech', 'gsnProfile', 'gsnProLogicRewardCard', '$location', myController]).directive(myDirectiveName, myDirective);

    function myDirective() {
        var directive = {
            restrict: 'EA',
            scope: true,
            controller: myDirectiveName
        };
        return directive;
    }

    function myController($scope, gsnStore, gsnApi, $timeout, $analytics, $filter, gsnYoutech, gsnProfile, gsnProLogicRewardCard, $location) {
        $scope.activate = activate;
        $scope.addCouponToCard = addCouponToCard;
        $scope.printManufacturerCoupon = printManufacturerCoupon;
        $scope.loadMore = loadMore;
        $scope.printer = {
            blocked: 0,
            notsupported: 0,
            notinstalled: 0,
            printed: null,
            count: 0,
            total: 0,
            isChrome: /chrome/gi.test(gsnApi.userAgent)
        };
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
        $scope.coupons = {
            printable: {
                items: []
            },
            digital: {
                items: []
            },
            store: {
                items: []
            }
        };
        $scope.vm = {
            filterBy: $location.search().q,
            sortBy: 'EndDate',
            sortByName: 'About to Expire'
        }
        $scope.couponType = $scope.friendlyPath.replace('coupons-', '');
        $scope.itemsPerPage = $location.search().itemsperpage || $location.search().itemsPerPage || $scope.itemsPerPage || 20;
        if ($scope.couponType.length < 1 || $scope.couponType == $scope.friendlyPath) {
            $scope.couponType = 'printable';
        }
        if ($scope.couponiFrame) {
            $scope.couponType = 'store';
            if (gsnApi.isNull(gsnApi.getSelectedStoreId(), 0) <= 0) {
                $scope.goUrl('/storelocator?fromUrl=' + encodeURIComponent($location.url()));
                return;
            }
        }

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
            $scope.coupons.printable.items = manuCoupons.items || [];
            $scope.coupons.store.items = instoreCoupons.items || [];
            $scope.coupons.digital.items = youtechCouponsOriginal.items || [];
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
            } else if ($scope.couponType == 'store') {
                list.items = instoreCoupons.items;
            } else {
                gsnStore.getManufacturerCouponTotalSavings().then(function (rst) {
                    $scope.selectedCoupons.totalSavings = parseFloat(rst.response).toFixed(2);
                });
                list.items = manuCoupons.items;
            }
        }

        function activate() {
            loadCoupons();
            // apply filter
            $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.vm.filterBy), {
                IsTargeted: false
            });
            $scope.preSelectedCoupons.items = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.items, $scope.vm.filterBy), $scope.vm.sortBy);
            $scope.preSelectedCoupons.targeted = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.targeted, $scope.vm.filterBy), $scope.vm.sortBy);
            $scope.selectedCoupons.items.length = 0;
            $scope.selectedCoupons.targeted = $scope.preSelectedCoupons.targeted;
            loadMore();
        }

        function init() {
            isValidProLogicInit();
        }

        function isValidProLogicInit() {
            gsnProfile.getProfile().then(function (p) {
                gsnProLogicRewardCard.getLoyaltyCard(p.response, function (card, isValid) {
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
        $scope.$on('gsnevent:youtech-cardcoupon-loadfail', activate);
        $scope.$watch('vm.sortBy', activate);
        $scope.$watch('vm.filterBy', activate);
        $scope.$watch('selectedCoupons.cardCouponOnly', activate);
        // trigger modal
        $scope.$on('gsnevent:gcprinter-not-supported', function () {
            $scope.printer.notsupported++;
        });
        $scope.$on('gsnevent:gcprinter-blocked', function () {
            $scope.printer.blocked++;
        });
        $scope.$on('gsnevent:gcprinter-not-found', function () {
            $scope.printer.notinstalled++;
        });
        $scope.$on('gsnevent:gcprinter-initcomplete', function () {
            $scope.gcprinter = gcprinter;
            $scope.printer.gcprinter = gcprinter;
        });
        $scope.$on('gsnevent:gcprinter-printed', function (evt, e, rsp) {
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
        $timeout(activate, 500);
        //#region Internal Methods
        function printManufacturerCoupon(evt, item) {
            $scope.printer.total = 1;
            $analytics.eventTrack('CouponPrintNow', {
                category: item.ExtCategory,
                label: item.Description,
                item: item
            });
        }

        function addCouponToCard(evt, item) {
            if ($scope.youtech.isAvailable(item.ProductCode)) {
                $scope.youtech.addCouponTocard(item.ProductCode).then(function (rst) {
                    if (rst.success) {
                        // log coupon add to card
                        //var cat = gsnStore.getCategories()[item.CategoryId];
                        $analytics.eventTrack('CouponAddToCard', {
                            category: item.ExtCategory,
                            label: item.Description,
                            item: item
                        });
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
                $analytics.eventTrack('CouponRemoveFromCard', {
                    category: item.ExtCategory,
                    label: item.Description,
                    item: item
                });
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
