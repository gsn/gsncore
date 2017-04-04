// for handling everything globally
(function(angular, undefined) {
    'use strict';
    var serviceId = 'gsnGlobal';
    angular.module('gsn.core').service(serviceId, ['$window', '$location', '$timeout', '$route', 'gsnApi', 'gsnProfile', 'gsnStore', '$rootScope', 'Facebook', '$analytics', 'gsnYoutech', 'gsnDfp', 'gsnAdvertising', '$anchorScroll', gsnGlobal]);

    function gsnGlobal($window, $location, $timeout, $route, gsnApi, gsnProfile, gsnStore, $rootScope, Facebook, $analytics, gsnYoutech, gsnDfp, gsnAdvertising, $anchorScroll) {
        var returnObj = {
            init: init,
            hasInit: false
        };
        return returnObj;

        function init(initProfile, $scope) {
            // prevent mulitple init
            if (returnObj.hasInit) {
                return returnObj;
            }
            returnObj.hasInit = true;
            if (initProfile) {
                gsnProfile.initialize();
            }
            gsnApi.gsn.$rootScope = $rootScope
            $scope = $scope || $rootScope;
            $scope.defaultLayout = gsnApi.getDefaultLayout(gsnApi.getThemeUrl('/views/layout.html'));
            $scope.currentLayout = $scope.defaultLayout;
            $scope.currentPath = '/';
            $scope.notFoundDefaultLayout = gsnApi.getThemeUrl('/views/404.html');
            $scope.notFoundLayout = $scope.notFoundDefaultLayout;
            $scope.gvm = {
                loginCounter: 0,
                menuInactive: false,
                shoppingListActive: false,
                profile: {},
                noCircular: true,
                reloadOnStoreSelection: false,
                currentStore: {},
                adsCollapsed: false
            };
            $scope.youtech = gsnYoutech;
            $scope.search = {
                site: '',
                item: ''
            };
            $scope.facebookReady = false;
            $scope.currentYear = new Date().getFullYear();
            $scope.facebookData = {};
            $scope.hasJustLoggedIn = false;
            $scope.loggedInWithFacebook = false;
            $scope.ChainName = gsnApi.getChainName();
            $scope.isLoggedIn = gsnApi.isLoggedIn();
            $scope.reload = gsnApi.reload;
            $scope.broadcastEvent = $rootScope.$broadcast;
            $scope.goUrl = gsnApi.goUrl;
            $scope.encodeURIComponent = encodeURIComponent;
            $scope.isOnList = gsnProfile.isOnList;
            $scope.getShoppingListCount = gsnProfile.getShoppingListCount;
            $scope.$win = $window;
            $scope.seo = {};
            $scope._tk = $window._tk;
            $scope.validateRegistration = function(rsp) {
                // attempt to authenticate user with facebook
                // get token
                $scope.facebookData.accessToken = rsp.authResponse.accessToken;
                // get email
                Facebook.api('/me?fields=id,name,email', function(response) {
                    $scope.facebookData.user = response;
                    if (response.email) {
                        // if user is already logged in, don't do it again
                        if (gsnApi.isLoggedIn()) return;
                        // attempt to authenticate
                        gsnProfile.loginFacebook(response.email, $scope.facebookData.accessToken);
                    }
                });
            };
            $scope.doFacebookLogin = function() {
                Facebook.getLoginStatus(function(response) {
                    if (response.status == 'connected' && response.authResponse.accessToken) {
                        $scope.validateRegistration(response);
                    } else {
                        Facebook.login(function(rsp) {
                            if (rsp.authResponse) {
                                $scope.validateRegistration(rsp);
                            }
                        }, {
                            scope: gsnApi.getFacebookPermission()
                        });
                    }
                });
            };
            $scope.doIfLoggedIn = function(callbackFunc) {
                if ($scope.isLoggedIn) {
                    callbackFunc();
                } else {
                    $scope.gvm.loginCounter++;
                }
            };
            $scope.clearSelection = gsnApi.clearSelection;
            $scope.getBindableItem = gsnApi.getBindableItem;
            $scope.updateBindableItem = gsnApi.getBindableItem;
            $scope.doSiteSearch = function() {
                $scope.goUrl('/search?q=' + encodeURIComponent($scope.search.site));
            };
            $scope.doItemSearch = function() {
                $scope.goUrl('/product/search?q=' + encodeURIComponent($scope.search.item));
            };
            $scope.getPageCount = gsnApi.getPageCount;
            $scope.getFullPath = gsnApi.getFullPath;
            $scope.decodeServerUrl = gsnApi.decodeServerUrl;
            $scope.goBack = function() {
                /// <summary>Cause browser to go back.</summary>
                if ($scope.currentPath != '/') {
                    gsnApi.goBack();
                }
            };
            $scope.logout = function() {
                gsnProfile.logOut();
                $scope.isLoggedIn = gsnApi.isLoggedIn();
                if ($scope.loggedInWithFacebook) {
                    $scope.loggedInWithFacebook = false;
                    Facebook.logout();
                }
                // allow time to logout
                $timeout(function() {
                    // reload the page to refresh page status on logout
                    if ($scope.currentPath == '/') {
                        gsnApi.reload();
                    } else {
                        $scope.goUrl('/');
                    }
                }, 500);
            };
            $scope.logoutWithPrompt = function() {
                try {
                    $scope.goOutPrompt(null, '/', $scope.logout, true);
                } catch (e) {
                    $scope.logout();
                }
            };
            $scope.logoutWithPromt = $scope.logoutWithPrompt;
            $scope.goOutPromt = $scope.goOutPrompt;
            $scope.print = function(timeout) {
                setTimeout($window.print, timeout || 5000);
            }
            $scope.getTitle = function() {
                return angular.element('title').text();
            }
            $scope.getSharePath = function(params) {
                var query = $location.search();
                params = params || {};
                angular.copy(query, params);
                return gsnApi.getFullPath($scope.currentPath + '?' + gsnApi.params(params));
            }
            $scope.doToggleCartItem = function(evt, item, linkedItem) {
                /// <summary>Toggle the shoping list item checked state</summary>
                /// <param name="evt" type="Object">for passing in angular $event</param>
                /// <param name="item" type="Object">shopping list item</param>
                if (item.ItemTypeId == 3) {
                    item.Quantity = gsnApi.isNaN(parseInt(item.SalePriceMultiple || item.PriceMultiple || 1), 1);
                }
                if (gsnProfile.isOnList(item)) {
                    gsnProfile.removeItem(item);
                } else {
                    if (linkedItem) {
                        item.OldQuantity = item.Quantity;
                        item.Quantity = linkedItem.NewQuantity;
                    }
                    gsnProfile.addItem(item);
                    if (item.ItemTypeId == 8) {
                        if (gsnApi.isNull(item.Varieties, null) === null) {
                            item.Varieties = [];
                        }
                        $scope.gvm.selectedItem = item;
                    }
                }
                $rootScope.$broadcast('gsnevent:shoppinglist-toggle-item', item);
            };
            $scope.$on('$routeChangeSuccess', function(evt, next, current) {
                if (typeof gmodal !== 'undefined') {
                    $timeout(function() {
                        gmodal.hide();
                    }, 50);
                }
                if ($location.hash()) {
                    $timeout(function() {
                        $anchorScroll();
                    }, 1000);
                }
            });
            // events handling
            $scope.$on('$locationChangeStart', function(evt, nxt, current) {
                /// <summary>Listen to location change</summary>
                /// <param name="evt" type="Object">Event object</param>
                /// <param name="nxt" type="String">next location</param>
                /// <param name="current" type="String">current location</param>
                var next = $route.routes[$location.path()];
                if (!next) next = {};
                // store the new route location
                $scope.seo = next.seo || {};
                $scope.currentPath = angular.lowercase(gsnApi.isNull($location.path(), ''));
                $scope.friendlyPath = $scope.currentPath.replace('/', '').replace(/\/+/gi, '-');
                $scope.gvm.search = $location.search();
                $scope.gvm.menuInactive = false;
                $scope.gvm.shoppingListActive = false;
                if (next.requireLogin && !$scope.isLoggedIn) {
                    evt.preventDefault();
                    $scope.goUrl('/signin?fromUrl=' + encodeURIComponent($location.url()));
                    return;
                }
                // handle storeRequired attribute
                if (next.storeRequired) {
                    if (gsnApi.isNull(gsnApi.getSelectedStoreId(), 0) <= 0) {
                        $scope.goUrl('/storelocator?fromUrl=' + encodeURIComponent($location.url()));
                        return;
                    }
                }

                $scope.currentLayout = $scope.defaultLayout;
                if (gsnApi.isNull(next.layout, '').length > 0) {
                    $scope.currentLayout = next.layout;
                }

                $scope.notFoundLayout = $scope.notFoundDefaultLayout;
                if (gsnApi.isNull(next.notFoundLayout, '').length > 0) {
                    $scope.notFoundLayout = next.notFoundLayout;
                }

                $scope.gvm.selectedItem = null;
            });
            $scope.$on('gsnevent:profile-load-success', function(event, result) {
                if (result.success) {
                    $scope.hasJustLoggedIn = false;
                    gsnProfile.getProfile().then(function(rst) {
                        if (rst.success) {
                            $scope.gvm.profile = rst.response;
                        }
                    });
                }
            });
            $scope.$on('gsnevent:login-success', function(event, result) {
                $scope.isLoggedIn = gsnApi.isLoggedIn();
                $analytics.eventTrack('SigninSuccess', {
                    category: result.payload.grant_type,
                    label: result.response.user_id
                });
                $scope.hasJustLoggedIn = true;
                $scope.loggedInWithFacebook = (result.payload.grant_type == 'facebook');
            });
            $scope.$on('gsnevent:login-failed', function(event, result) {
                if (result.payload.grant_type == 'facebook') {
                    if (gsnApi.isLoggedIn()) return;
                    $scope.goUrl('/registration/facebook');
                    $analytics.eventTrack('SigninFailed', {
                        category: result.payload.grant_type,
                        label: gsnApi.getProfileId()
                    });
                }
            });
            $scope.$on('gsnevent:store-setid', function(event, result) {
                gsnStore.getStore().then(function(store) {
                    $analytics.eventTrack('StoreSelected', {
                        category: store.StoreName,
                        label: store.StoreNumber + ''
                    });
                    $scope.gvm.currentStore = store;
                    gsnProfile.getProfile().then(function(rst) {
                        if (rst.success) {
                            if (rst.response.PrimaryStoreId != store.StoreId) {
                                // save selected store
                                gsnProfile.selectStore(store.StoreId).then(function() {
                                    // broadcast persisted on server response
                                    $rootScope.$broadcast('gsnevent:store-persisted', store);
                                });
                            }
                        }
                    });
                });
            });
            $scope.$on('gsnevent:circular-loading', function(event, data) {
                $scope.gvm.noCircular = true;
            });
            $scope.$on('gsnevent:circular-loaded', function(event, data) {
                $scope.gvm.noCircular = !data.success;
            });
            // trigger facebook init if there is appId
            if (typeof(Facebook.isReady) !== 'undefined' && gsnApi.getConfig().FacebookAppId) {
                $scope.$watch(function() {
                    return Facebook.isReady(); // This is for convenience, to notify if Facebook is loaded and ready to go.
                }, function(newVal) {
                    $scope.facebookReady = true; // You might want to use this to disable/show/hide buttons and else
                    if (gsnApi.isLoggedIn()) return;
                    // attempt to auto login facebook user
                    Facebook.getLoginStatus(function(response) {
                        // only auto login for connected status
                        if (response.status == 'connected') {
                            $scope.validateRegistration(response);
                        }
                    });
                });
            }
            $scope.$on('gsnevent:closemodal', function() {
                if (typeof gmodal !== 'undefined') {
                    gmodal.hide();
                }
            });
            //#region analytics
            $scope.$on('gsnevent:shoppinglistitem-updating', function(event, shoppingList, item) {
                var currentListId = gsnApi.getShoppingListId();
                if (shoppingList.ShoppingListId == currentListId) {
                    try {
                        var cat = gsnStore.getCategories()[item.CategoryId];
                        var evt = 'MiscItemAddUpdate';
                        if (item.ItemTypeId == 8) {
                            evt = 'CircularItemAddUpdate';
                        } else if (item.ItemTypeId == 2) {
                            evt = 'ManufacturerCouponAddUpdate';
                        } else if (item.ItemTypeId == 3) {
                            evt = 'ProductAddUpdate';
                        } else if (item.ItemTypeId == 5) {
                            evt = 'RecipeIngredientAddUpdate';
                        } else if (item.ItemTypeId == 6) {
                            evt = 'OwnItemAddUpdate';
                        } else if (item.ItemTypeId == 10) {
                            evt = 'StoreCouponAddUpdate';
                        } else if (item.ItemTypeId == 13) {
                            evt = 'YoutechCouponAddUpdate';
                        }
                        $analytics.eventTrack(evt, {
                            category: (item.ItemTypeId == 13) ? item.ExtCategory : cat.CategoryName,
                            label: item.Description,
                            item: item
                        });
                    } catch (e) {}
                }
            });
            $scope.$on('gsnevent:shoppinglistitem-removing', function(event, shoppingList, item) {
                var currentListId = gsnApi.getShoppingListId();
                if (shoppingList.ShoppingListId == currentListId) {
                    try {
                        var cat = gsnStore.getCategories()[item.CategoryId],
                            coupon = null,
                            itemId = item.ItemId;
                        if (item.ItemTypeId == 8) {
                            $analytics.eventTrack('CircularItemRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 2) {
                            coupon = gsnStore.getCoupon(item.ItemId, 2);
                            if (coupon) {
                                item = coupon;
                                if (gsnApi.isNull(item.ProductCode, '').length > 0) {
                                    itemId = item.ProductCode;
                                }
                            }
                            $analytics.eventTrack('ManufacturerCouponRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 3) {
                            $analytics.eventTrack('ProductRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 5) {
                            $analytics.eventTrack('RecipeIngredientRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 6) {
                            $analytics.eventTrack('OwnItemRemove', {
                                label: item.Description
                            });
                        } else if (item.ItemTypeId == 10) {
                            coupon = gsnStore.getCoupon(item.ItemId, 10);
                            if (coupon) {
                                item = coupon;
                                if (gsnApi.isNull(item.ProductCode, '').length > 0) {
                                    itemId = item.ProductCode;
                                }
                            }
                            $analytics.eventTrack('StoreCouponRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 13) {
                            coupon = gsnStore.getCoupon(item.ItemId, 13);
                            if (coupon) {
                                item = coupon;
                                if (gsnApi.isNull(item.ProductCode, '').length > 0) {
                                    itemId = item.ProductCode;
                                }
                            }
                            $analytics.eventTrack('YoutechCouponRemove', {
                                category: item.ExtCategory,
                                label: item.Description,
                                item: item
                            });
                        } else {
                            $analytics.eventTrack('MiscItemRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        }
                    } catch (e) {}
                }
            });

            function gsnModalTracking(evt, el, track) {
                var actionName = evt.name.replace("gsnevent:", "-")
                if (track) {
                    $analytics.eventTrack(gsnApi.isNull(track.action, '') + actionName, track);
                    if (track.timedload) {
                        // trigger load ads event
                        $timeout(function() {
                            $rootScope.$broadcast('gsnevent:loadads');
                        }, parseInt(track.timedload));
                    }
                }
            }
            $scope.$on('gsnevent:gsnmodal-hide', gsnModalTracking);
            $scope.$on('gsnevent:gsnmodal-show', gsnModalTracking);

            function doTrakless() {
                if (gsnApi.isNull($window._tk, null) === null) {
                    $timeout(doTrakless, 50);
                    return;
                }
                for (var k in $window._tk.trackers) {
                    $window._tk.trackers[k].on('track', function(item) {
                        // populate with page url, storeid, consumerid, is anonymous
                        if (!item.dt) {
                            item.dt = $scope.currentPath;
                        }
                        item.stid = gsnApi.getSelectedStoreId();
                        item.anon = gsnApi.isLoggedIn();
                        var profile = $scope.gvm.profile || {};
                        if (profile.Id) item.uid = profile.Id;
                        if (profile.ExternalId) item.loyid = profile.ExternalId;
                    });
                }
            }
            //#endregion
        } // init
    }
})(angular);
