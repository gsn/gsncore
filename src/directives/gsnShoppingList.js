(function(angular, undefined) {

  angular.module('gsn.core')
    .directive('gsnShoppingList', ['gsnApi', '$timeout', 'gsnProfile', '$routeParams', '$rootScope', 'gsnStore', '$location', '$filter',
      function(gsnApi, $timeout, gsnProfile, $routeParams, $rootScope, gsnStore, $location, $filter) {
        // Usage:  use to manipulate a shopping list on the UI
        //
        // Creates: 2014-01-13 TomN
        //
        var directive = {
          restrict: 'EA',
          scope: true,
          controller: ['$scope', '$element', '$attrs', controller],
          link: link
        };
        return directive;

        function link(scope, element, attrs) {
          scope.reloadShoppingList();
        }

        function controller($scope, $element, $attrs) {
          $scope.coupons = [];
          $scope.instoreCoupons = [];
          $scope.circularCoupons = [];
          $scope.addString = '';
          $scope.pluginItemCount = 10;
          $scope.topitems = [];
          $scope.hasInitializePrinter = false;
          $scope.totalQuantity = 0;
          $scope.mylist = null;
          $scope.groupBy = 'CategoryName';
          $scope.currentDate = new Date();
          $scope.shoppinglistsaved = 0;
          $scope.shoppinglistdeleted = 0;
          $scope.shoppinglistcreated = 0;
          $scope.circular = gsnStore.getCircularData();

          $scope.reloadShoppingList = function(shoppingListId) {
            $timeout(function() {
              if ($attrs.gsnShoppingList === 'savedlists') {
                if ($scope.getSelectedShoppingListId) {
                  shoppingListId = $scope.getSelectedShoppingListId();
                }
              }

              $scope.mylist = $scope.doMassageList(gsnProfile.getShoppingList(shoppingListId));

              if ($scope.mylist) {
                if (!$scope.mylist.hasLoaded()) {
                  $scope.doRefreshList();
                }
              } else if (shoppingListId) {
                // if not saved list and current shopping list, then
                if ($attrs.gsnShoppingList !== 'savedlists' && shoppingListId === gsnApi.getShoppingListId()) {
                  $scope.mylist = gsnProfile.getShoppingList();
                  $scope.doRefreshList();
                }
              }

            }, 50);
          };

          $scope.doMassageList = function(list) {
            if (gsnApi.isNull(list, null) === null) return null;

            $scope.coupons.length = 0;
            $scope.totalQuantity = 0;
            $scope.title = list.getTitle();
            $scope.currentDate = new Date();
            if (gsnApi.isNull($scope.newTitle, null) === null) {
              if (list.getStatus() > 1) {
                $scope.newTitle = $scope.title;
              } else {
                $scope.newTitle = null;
              }
            }
            list.topitems = [];
            list.items = gsnApi.isNull(list.items, []);
            list.items.length = 0;

            // calculate the grouping
            // and make list calculation
            var items = list.allItems(),
              totalQuantity = 0;

            if (gsnApi.isNull(list.items, []).length > 0) {
              items = list.items;
            } else {
              list.items = items;
            }

            var categories = gsnStore.getCategories();

            angular.forEach(items, function(item, idx) {
              if (gsnApi.isNull(item.CategoryName, null) === null) {
                // in javascript, null is actually != to undefined
                var cat = categories[item.CategoryId || null];
                if (cat) {
                  item.CategoryName = gsnApi.isNull(cat.CategoryName, '');
                } else {
                  item.CategoryName = gsnApi.isNull(item.CategoryName, '');
                }
              }

              item.BrandName = gsnApi.isNull(item.BrandName, '');

              if (item.IsCoupon) {

                // since the server does not return a product code, we get it from local coupon index
                var coupon = gsnStore.getCoupon(item.ItemId, item.ItemTypeId);
                if (coupon) {
                  item.LinkedItem = coupon;
                  item.ProductCode = coupon.ProductCode;
                  item.StartDate = coupon.StartDate;
                  item.EndDate = coupon.EndDate;
                  item.Description2 = coupon.Description2;

                  // Get the temp quantity.
                  var tmpQuantity = gsnApi.isNaN(parseInt(coupon.Quantity), 0);

                  // If the temp quantity is zero, then set one.
                  item.Quantity = (tmpQuantity > 0) ? tmpQuantity : 1;


                  if (item.ItemTypeId === 13) {
                    item.CategoryName = 'Digital Coupon';
                  }

                  // Push the coupons
                  if (item.ItemTypeId === 10) {
                    $scope.instoreCoupons.push(coupon);
                  }

                  item.SmallImageUrl = item.SmallImageUrl || coupon.SmallImageUrl;
                  item.ImageUrl = item.ImageUrl || coupon.ImageUrl;
                }

                $scope.coupons.push(item);
              } else if (item.ItemTypeId === 0 && item.Meta) {
                if (!item.LinkedItem && (item.Meta + '').indexOf('}') > 0) {
                  item.LinkedItem = JSON.parse(item.Meta);
                }
                if (item.LinkedItem) {

                  var quantity = parseInt(item.LinkedItem.prePriceText);
                  if (isNaN(quantity)) {
                    quantity = 1;
                  }
                  item.CategoryName = item.LinkedItem.category;
                  item.Description = item.LinkedItem.name;
                  item.Description2 = item.LinkedItem.description;
                  item.PriceString = item.LinkedItem.prePriceText + ' ' + item.LinkedItem.priceText + ' ' + item.LinkedItem.postPriceText;
                  item.ImageUrl = item.LinkedItem.imageUrl;
                  item.SmallImageUrl = item.LinkedItem.imageUrl;
                  item.StartDate = item.LinkedItem.validFrom;
                  item.EndDate = item.LinkedItem.validTo;
                }
              } else {
                // determine if circular item is a coupon
                var circCoupon = gsnStore.getItem(item.ItemId);
                item.LinkedItem = circCoupon || {};
                if (circCoupon) {
                  if (circCoupon.CouponImageUrl) {
                    item.CouponImageUrl = circCoupon.CouponImageUrl;
                    item.Description2 = circCoupon.ItemDescription;
                    item.EndDate = $scope.circular.Circulars[0].EndDate;
                    $scope.circularCoupons.push(item);
                  }

                  // repopulate image url
                  item.SmallImageUrl = item.SmallImageUrl || circCoupon.SmallImageUrl;
                  item.ImageUrl = item.ImageUrl || circCoupon.ImageUrl;

                  // repopulate price string
                  item.PriceString = circCoupon.PriceString;
                }

              }

              if (gsnApi.isNull(item.PriceString, '').length <= 0) {
                if (item.Price) {
                  item.PriceString = '$' + parseFloat(item.Price).toFixed(2);
                }
              }

              totalQuantity += gsnApi.isNaN(parseInt(item.Quantity), 0);
              item.NewQuantity = item.Quantity;
              item.selected = false;
              item.zIndex = 900 - idx;

              // resolve circular reference
              if (item.LinkedItem === item) {
                var newItem = angular.copy(item);
                gsnApi.del(newItem, 'LinkedItem');
                item.LinkedItem = newItem;
              }
            });

            $scope.totalQuantity = totalQuantity;
            // only get topN for current list
            if (list.ShoppingListId === gsnApi.getShoppingListId()) {
              // get top N items
              gsnApi.sortOn(items, 'Order');
              list.topitems = angular.copy(items);

              if (items.length > $scope.pluginItemCount) {
                list.topitems = list.topitems.splice(items.length - $scope.pluginItemCount);
              }

              list.topitems.reverse();
              $scope.topitems = list.topitems;
              $rootScope.$broadcast('gsnevent:shoppinglist-itemtops', $scope.topitems);
            }

            var newAllItems = [];
            if (gsnApi.isNull($scope.groupBy, '').length <= 0) {
              newAllItems = [{
                key: '',
                items: items
              }];
            } else {
              newAllItems = gsnApi.groupBy(items, $scope.groupBy, function(item) {
                gsnApi.sortOn(item.items, 'Description');
              });
            }

            for (var i = 0; i < newAllItems.length; i++) {

              var fitems = newAllItems[i].items;

              // use scope search because it might have changed during timeout
              if (gsnApi.isNull($scope.listSearch, '').length <= 0) {
                fitems = $filter('filter')(fitems, $scope.listSearch);
              }

              newAllItems[i].fitems = fitems;
            }

            $scope.allItems = newAllItems;
            $rootScope.$broadcast('gsnevent:gsnshoppinglist-itemavailable');
            return list;
          };

          $scope.doUpdateQuantity = function(item) {
            var list = $scope.mylist;
            item.OldQuantity = item.Quantity;
            item.Quantity = parseInt(item.NewQuantity);
            list.syncItem(item);
          };

          $scope.doAddSelected = function() {
            var list = $scope.mylist;
            var toAdd = [];
            angular.forEach(list.items, function(item, k) {
              if (true === item.selected) {
                toAdd.push(item);
              }
            });

            //  Issue: The previous version of this code was adding to the list regardless of if it was previously added. Causing the count to be off.
            angular.forEach(toAdd, function(item, k) {
              if (false === gsnProfile.isOnList(item)) {
                gsnProfile.addItem(item);
              } else {
                // Remove the selection state from the item, it was already on the list.
                item.selected = false;
              }
            });
          };

          $scope.doDeleteList = function() {
            gsnProfile.deleteShoppingList($scope.mylist);

            // cause this list to refresh
            $scope.$emit('gsnevent:savedlists-deleted', $scope.mylist);
          };

          $scope.doAddOwnItem = function() {
            var list = $scope.mylist;
            var addString = gsnApi.isNull($scope.addString, '');
            if (addString.length < 1) {
              return;
            }

            gsnProfile.addItem({
              ItemId: null,
              Description: $scope.addString,
              ItemTypeId: 6,
              Quantity: 1
            });
            $scope.addString = '';

            // refresh list
            $scope.doMassageList(list);
          };

          $scope.doSaveList = function(newTitle) {
            // save list just means to change the title
            if (!gsnApi.isLoggedIn()) {
              // fallback message
              $rootScope.$broadcast('gsnevent:login-required');
              return;
            }

            var list = $scope.mylist;
            list.setTitle(newTitle).then(function(response) {});
          };

          $scope.doSelectAll = function() {
            var list = $scope.mylist;
            if (list.items[0]) {
              var selected = (list.items[0].selected) ? false : true;
              angular.forEach(list.items, function(v, k) {
                v.selected = selected;
              });
            }
          };

          /* begin item menu actions */
          $scope.doItemRemove = function(item) {
            var list = $scope.mylist;
            list.removeItem(item);
            $scope.doMassageList(list);
          };

          $scope.doItemAddToCurrentList = function(item) {
            if (gsn.isNull(item, null) !== null) {

              //var mainList = gsnProfile.getShoppingList();
              gsnProfile.addItem(item);
            }
          };

          $scope.doRefreshList = function() {
            if ($scope.mylist) {
              $scope.mylist.updateShoppingList().then(function(response) {
                if (response.success) {
                  // refresh
                  $scope.doMassageList($scope.mylist);
                }
              });
            }
          };

          function handleShoppingListEvent(event, shoppingList) {
            // ignore bad events
            if (gsnApi.isNull(shoppingList, null) === null) {
              return;
            }

            if (gsnApi.isNull($scope.mylist) || ($attrs.gsnShoppingList === 'savedlists')) {
              // current list is null, reload
              $scope.reloadShoppingList();
              return;
            }

            if (gsnApi.isNull($scope.mylist, null) === null) {
              $scope.reloadShoppingList(shoppingList.ShoppingListId);
              return;
            }

            // detect list changed, update the list
            if (shoppingList.ShoppingListId === $scope.mylist.ShoppingListId) {
              $scope.reloadShoppingList($scope.mylist.ShoppingListId);
            }
          }

          $scope.$on('gsnevent:shoppinglist-changed', handleShoppingListEvent);
          $scope.$on('gsnevent:shoppinglist-loaded', handleShoppingListEvent);
          $scope.$on('gsnevent:shoppinglist-page-loaded', handleShoppingListEvent);
          $scope.$on('gsnevent:savedlists-selected', handleShoppingListEvent);

          $scope.$on('gsnevent:circular-loaded', function(event, data) {
            if (data.success) {
              $scope.reloadShoppingList();
            }

            $scope.circular = gsnStore.getCircularData();
          });

          // Events for modal confirmation.
          $scope.$on('gsnevent:shopping-list-saved', function() {
            $scope.shoppinglistsaved++;
          });

          $scope.$on('gsnevent:shopping-list-deleted', function() {
            $scope.shoppinglistdeleted++;
          });

          // Per Request: signal that the list has been created.
          $scope.$on('gsnevent:shopping-list-created', function(event, data) {
            $scope.shoppinglistcreated++;
          });
        }
      }
    ]);

})(angular);
