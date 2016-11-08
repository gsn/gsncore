(function(angular, undefined) {
  'use strict';
  var serviceId = 'gsnProfile';
  angular.module('gsn.core').service(serviceId, ['$rootScope', '$http', 'gsnApi', '$q', 'gsnList', 'gsnStore', '$location', '$timeout', '$sessionStorage', '$localStorage', 'gsnRoundyProfile', gsnProfile]);

  function gsnProfile($rootScope, $http, gsnApi, $q, gsnList, gsnStore, $location, $timeout, $sessionStorage, $localStorage, gsnRoundyProfile) {
    var returnObj = {},
      previousProfileId = gsnApi.getProfileId(),
      couponStorage = $sessionStorage,
      $profileDefer = null,
      $creatingDefer = null;
    var $savedData = {
      allShoppingLists: {},
      profile: null,
      profileData: {
        scoredProducts: {},
        circularItems: {},
        availableCoupons: {},
        myPantry: {}
      }
    };

    $rootScope[serviceId] = returnObj;
    gsnApi.gsn.$profile = returnObj;
    returnObj.getShoppingListId = gsnApi.getShoppingListId;

    returnObj.getProfileId = gsnApi.getProfileId;

    returnObj.createNewShoppingList = function() {
      /// <summary>Create a new shopping list.</summary>

      if ($creatingDefer) return $creatingDefer.promise;

      $creatingDefer = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getShoppingListApiUrl() + '/Create/' + gsnApi.getProfileId();
        $http.post(url, {}, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          var result = response;
          $savedData.allShoppingLists[result.Id] = gsnList(result.Id, result);
          gsnApi.setShoppingListId(result.Id);
          $rootScope.$broadcast('gsnevent:shoppinglist-created', $savedData.allShoppingLists[result.Id]);
          $creatingDefer.resolve({
            success: true,
            response: $savedData.allShoppingLists[result.Id]
          });
          $creatingDefer = null;
        }).error(function(response) {
          $creatingDefer.resolve({
            success: false,
            response: response
          });
          $creatingDefer = null;
        });
      });

      return $creatingDefer.promise;
    };

    returnObj.login = function(user, pass) {
      var payload = {
        grant_type: "password",
        client_id: gsnApi.getChainId(),
        access_type: 'offline',
        username: user,
        password: pass
      };

      gsnApi.doAuthenticate(payload);
    };

    returnObj.loginFacebook = function(user, facebookToken) {
      var payload = {
        grant_type: "facebook",
        client_id: gsnApi.getChainId(),
        access_type: 'offline',
        username: user,
        password: facebookToken
      };

      gsnApi.doAuthenticate(payload);
    };

    // when initialize
    // if no profile id, it should create a shopping list to get a new profile id and set to current
    returnObj.initialize = function() {
      // get profile
      var profileId = parseInt(gsnApi.isNull(returnObj.getProfileId(), 0));
      if (profileId > 0) {
        returnObj.getProfile(true);
      }

      gsnStore.initialize();
    };

    // when user log out
    // it should reset shopping list
    returnObj.logOut = function() {
      gsnApi.logOut();
      couponStorage.clipped = [];
      couponStorage.printed = [];
      couponStorage.preClipped = {};
    };

    // proxy method to add item to current shopping list
    returnObj.addItem = function(item) {
      var shoppingList = returnObj.getShoppingList();
      if (shoppingList) {
        if (gsnApi.isNull(item.ItemTypeId, -1) < 0) {
          item.ItemTypeId = 6; // Misc or Own Item type
        }

        shoppingList.addItem(item);
      }
    };

    // proxy method to add items to current shopping list
    returnObj.addItems = function(item) {
      var shoppingList = returnObj.getShoppingList();

      // TODO: throw error for no current shopping list?
      return shoppingList.addItems(item);
    };

    returnObj.isOnList = function(item) {
      var shoppingList = returnObj.getShoppingList();
      if (shoppingList) {
        var slItem = shoppingList.getItem(item.ItemId, item.ItemTypeId);
        return gsnApi.isNull(slItem, null) !== null;
      }

      return false;
    };

    // proxy method to remove item of current shopping list
    returnObj.removeItem = function(item) {
      var shoppingList = returnObj.getShoppingList();
      if (shoppingList) {
        shoppingList.removeItem(item);
      }
    };

    // delete shopping list provided id
    returnObj.deleteShoppingList = function(list) {
      list.deleteList();
      $savedData.allShoppingLists[list.ShoppingListId] = null;
    };

    // get shopping list provided id
    returnObj.getShoppingList = function(shoppingListId) {
      if (gsnApi.isNull(shoppingListId, null) === null)
        shoppingListId = returnObj.getShoppingListId();

      var result = $savedData.allShoppingLists[shoppingListId];
      return result;
    };

    // get all shopping lists
    returnObj.getShoppingLists = function() {
      var result = [];
      angular.forEach($savedData.allShoppingLists, function(v, k) {
        result.push(v);
      });

      gsnApi.sortOn(result, 'ShoppingListId');
      result.reverse();
      return result;
    };

    // get count of current shopping list
    returnObj.getShoppingListCount = function() {
      var list = returnObj.getShoppingList();
      return list ? list.getCount() : 0;
    };

    // get the profile object
    returnObj.getProfile = function(callApi) {
      if ($profileDefer) return $profileDefer.promise;

      $profileDefer = $q.defer();
      if (gsnApi.isNull($savedData.profile, null) === null || callApi) {
        // at this point, we already got the id so proceed to reset other data
        $timeout(function() {
          // reset other data
          $savedData = {
            allShoppingLists: {},
            profile: null,
            profileData: {
              scoredProducts: {},
              circularItems: {},
              availableCoupons: {},
              myPantry: {}
            }
          };
          returnObj.refreshShoppingLists();
        }, 5);


        gsnApi.getAccessToken().then(function() {

          // don't need to load profile if anonymous
          if (gsnApi.isAnonymous()) {
            $savedData.profile = {
              "Id": returnObj.getProfileId(),
              "SiteId": gsnApi.getChainId(),
              "PrimaryStoreId": gsnApi.getSelectedStoreId()
            };

            $rootScope.$broadcast('gsnevent:profile-load-success', {
              success: true,
              response: $savedData.profile
            });
            $profileDefer.resolve({
              success: true,
              response: $savedData.profile
            });
            $profileDefer = null;
          } else {

            // cause Roundy profile to load from another method
            if (gsnApi.getConfig().hasRoundyProfile) {
              gsnRoundyProfile.getProfile().then(function(rst) {
                if (rst.success) {
                  $savedData.profile = rst.response;
                  $rootScope.$broadcast('gsnevent:profile-load-success', {
                    success: true,
                    response: $savedData.profile
                  });
                  $profileDefer.resolve(rst);
                  $profileDefer = null;
                } else {
                  gsnLoadProfile();
                }
              });

            } else {
              gsnLoadProfile();
            }
          }
        });

      } else {
        $timeout(function() {
          $profileDefer.resolve({
            success: true,
            response: $savedData.profile
          });
          $profileDefer = null;
        }, 10);
      }

      return $profileDefer.promise;
    };

    function gsnLoadProfile() {
      var url = gsnApi.getProfileApiUrl() + "/By/" + returnObj.getProfileId();
      $http.get(url, {
        headers: gsnApi.getApiHeaders()
      }).success(function(response) {
        $savedData.profile = response;
        $rootScope.$broadcast('gsnevent:profile-load-success', {
          success: true,
          response: $savedData.profile
        });
        $profileDefer.resolve({
          success: true,
          response: $savedData.profile
        });
        $profileDefer = null;
      }).error(function(response) {
        $rootScope.$broadcast('gsnevent:profile-load-failed', {
          success: false,
          response: response
        });
        $profileDefer.resolve({
          success: false,
          response: response
        });
        $profileDefer = null;
      });
    }

    // when user register
    // it should convert anonymous profile to perm
    returnObj.registerProfile = function(p) {
      return registerOrUpdateProfile(p, false);
    };

    returnObj.changePassword = function(userName, currentPassword, newPassword) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/ChangePassword";
        $http.post(url, {
          UserName: userName,
          Password: currentPassword,
          NewPassword: newPassword
        }, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: (response == 'true'),
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    // when user recover password
    // it should call api and return server result
    returnObj.recoverPassword = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + '/RecoverPassword';
        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: (response == 'true'),
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.recoverUsername = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + '/RecoverUsername';
        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: (response == 'true'),
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.unsubscribeEmail = function(email) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + '/Unsubscribe/?email=' + encodeURIComponent(email);
        $http.post(url, {
          email: email
        }, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    // when user update profile
    // it should restore user old password if none is provided
    returnObj.updateProfile = function(p) {
      return registerOrUpdateProfile(p, true);
    };

    // when user is a registered user
    // allow for shopping lists refresh
    returnObj.refreshShoppingLists = function() {
      if (returnObj.refreshingDeferred) return returnObj.refreshingDeferred.promise;

      // determine if logged in
      // sync list
      var deferred = $q.defer();
      returnObj.refreshingDeferred = deferred;
      $savedData.allShoppingLists = {};

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getShoppingListApiUrl() + '/List/' + gsnApi.getProfileId();
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          if (response.length > 0) {
            for (var i = 0; i < response.length; i++) {
              var list = response[i];
              list.ShoppingListId = list.Id;
              var shoppingList = gsnList(list.ShoppingListId, list);
              $savedData.allShoppingLists[list.ShoppingListId] = shoppingList;

              // grab the first shopping list and make it current list id
              if (i === 0) {
                // ajax load first shopping list
                shoppingList.updateShoppingList();

                gsnApi.setShoppingListId(list.ShoppingListId);
              }
            }
          } else {
            returnObj.createNewShoppingList();
          }

          returnObj.refreshingDeferred = null;

          $rootScope.$broadcast('gsnevent:shoppinglists-loaded', {
            success: true,
            response: response
          });
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {

          returnObj.refreshingDeferred = null;
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.getMyCircularItems = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetCircularItems/' + gsnApi.getProfileId();
      return gsnApi.http($savedData.profileData.circularItems, url);
    };

    returnObj.getMyPantry = function(departmentId, categoryId) {
      var url = gsnApi.getProfileApiUrl() + '/GetPantry/' + gsnApi.getProfileId() + '?' + 'departmentId=' + gsnApi.isNull(departmentId, '') + '&categoryId=' + gsnApi.isNull(categoryId, '');
      return gsnApi.http($savedData.profileData.myPantry, url);
    };

    returnObj.getMyPantry2 = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetPantry2/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http($savedData.profileData.myPantry, url);
    };

    returnObj.getMyProducts = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetScoredProducts/' + gsnApi.getProfileId();
      return gsnApi.http($savedData.profileData.scoredProducts, url);
    };

    returnObj.getMyRecipes = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetSavedRecipes/' + gsnApi.getProfileId();
      return gsnApi.http({}, url);
    };

    returnObj.rateRecipe = function(recipeId, rating) {
      var url = gsnApi.getProfileApiUrl() + '/RateRecipe/' + recipeId + '/' + gsnApi.getProfileId() + '/' + rating;
      return gsnApi.http({}, url, {});
    };

    returnObj.getMyRecipe = function(recipeId) {
      var url = gsnApi.getProfileApiUrl() + '/GetSavedRecipe/' + gsnApi.getProfileId() + '/' + recipeId;
      return gsnApi.http({}, url);
    };

    returnObj.saveRecipe = function(recipeId, comment) {
      var url = gsnApi.getProfileApiUrl() + '/SaveRecipe/' + recipeId + '/' + gsnApi.getProfileId() + '?comment=' + encodeURIComponent(comment);
      return gsnApi.http({}, url, {});
    };

    returnObj.saveProduct = function(productId, comment) {
      var url = gsnApi.getProfileApiUrl() + '/SaveProduct/' + productId + '/' + gsnApi.getProfileId() + '?comment=' + encodeURIComponent(comment);
      return gsnApi.http({}, url, {});
    };

    returnObj.selectStore = function(storeId) {
      var url = gsnApi.getProfileApiUrl() + '/SelectStore/' + gsnApi.getProfileId() + '/' + storeId;
      return gsnApi.http({}, url, {});
    };

    returnObj.getCampaign = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetCampaign/' + gsnApi.getProfileId();
      return gsnApi.http({}, url);
    };

    returnObj.resetCampaign = function() {
      $sessionStorage.GsnCampaign = 0;
    };

    returnObj.sendContactUs = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/SendContactUs";

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.sendEmail = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/SendEmail";

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.sendEmploymentEmail = function(payload, selectedStoreId) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/SendEmployment/" + selectedStoreId;

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders(),
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.clipCoupon = function(productCode) {
      if (!couponStorage.clipped)
        couponStorage.clipped = [];
      if (couponStorage.clipped.indexOf(productCode) < 0)
        couponStorage.clipped.push(productCode);
    };

    returnObj.unclipCoupon = function(productCode) {
      var index = couponStorage.clipped.indexOf(productCode);
      couponStorage.clipped.splice(index, 1);
    };

    returnObj.getClippedCoupons = function() {
      return couponStorage.clipped;
    };

    returnObj.savePreclippedCoupon = function(item) {
      couponStorage.preClipped = item;
    };

    returnObj.getPreclippedCoupon = function() {
      return couponStorage.preClipped;
    };

    returnObj.addPrinted = function(productCode) {
      if (!couponStorage.printed)
        couponStorage.printed = [];
      if (couponStorage.printed.indexOf(productCode) < 0)
        couponStorage.printed.push(productCode);
    };

    returnObj.getPrintedCoupons = function() {
      return couponStorage.printed;
    };

    //#region Events Handling
    $rootScope.$on('gsnevent:shoppinglist-item-response', function(event, args) {
      var response = args[1],
        existingItem = args[2],
        mySavedData = args[3];

      // only process server response if logged in
      if (gsnApi.isLoggedIn()) {

        if (existingItem.ItemId != response.ItemId) {
          mySavedData.items[existingItem.ItemId] = null;
          existingItem.ItemId = response.ItemId;
        }

        // retain order
        if (existingItem.zPriceMultiple) {
          response.PriceMultiple = existingItem.zPriceMultiple;
        }

        response.Order = existingItem.Order;
        mySavedData.items[existingItem.ItemId] = response.d;
      }
    });

    $rootScope.$on('gsnevent:profile-setid', function(event, profileId) {
      // attempt to load profile
      if (previousProfileId != profileId) {
        previousProfileId = profileId;
        returnObj.getProfile(true);
        returnObj.resetCampaign();
      }
    });

    $rootScope.$on('gsnevent:profile-load-success', function(event, result) {
      // attempt to set store id
      if (gsnApi.isNull(result.response.PrimaryStoreId, 0) > 0) {
        gsnApi.setSelectedStoreId(result.response.PrimaryStoreId);
      }
    });

    $rootScope.$on('gsnevent:store-setid', function(event, values) {
      if (values.newValue != values.oldValue) {
        // must check for null because it could be that user just
        // logged in and he/she would no longer have the anonymous shopping list
        var currentList = returnObj.getShoppingList();
        if (currentList) {
          currentList.updateShoppingList();
        }
      }
    });

    //#endregion

    //#region helper methods
    function registerOrUpdateProfile(profile, isUpdate) {
      /// <summary>Helper method for registering or update profile</summary>

      var deferred = $q.defer();

      // clean up model before proceeding
      // there should not be any space in email or username
      var email = gsnApi.isNull(profile.Email, '').replace(/\s+/gi, '');
      var username = gsnApi.isNull(profile.UserName, '').replace(/\s+/gi, '');
      if (username.length <= 0) {
        username = email;
      }

      // set empty to prevent update
      if (email.length <= 0) {
        email = null;
      }
      if (username.length <= 0) {
        username = null;
      }

      // setting up the payload, should we also add another level of validation here?
      var payload = {
        Email: email,
        UserName: username,
        Password: gsnApi.isNull(profile.Password, ''),
        ReceiveEmail: gsnApi.isNull(profile.ReceiveEmail, false),
        ReceivePostalMail: gsnApi.isNull(profile.ReceivePostalMail, false),
        ReceiveSms: gsnApi.isNull(profile.ReceiveSms, true),
        Phone: gsnApi.isNull(profile.Phone, '').replace(/[^0-9]+/gi, ''),
        PrimaryStoreId: gsnApi.isNull(profile.PrimaryStoreId, gsnApi.getSelectedStoreId()),
        FirstName: gsnApi.isNull(profile.FirstName, '').replace(/[`]+/gi, '\''),
        LastName: gsnApi.isNull(profile.LastName, '').replace(/[`]+/gi, '\''),
        ExternalId: profile.ExternalId,
        WelcomeSubject: profile.WelcomeSubject,
        WelcomeMessage: profile.WelcomeMessage,
        FacebookUserId: profile.FacebookUserId,
        SiteId: gsnApi.getChainId(),
        Id: gsnApi.getProfileId()
      };

      // set empty to prevent update
      if (payload.Password === '') {
        payload.Password = null;
      }
      if (payload.LastName === '') {
        payload.LastName = null;
      }
      if (payload.FirstName === '') {
        payload.FirstName = null;
      }
      if (gsnApi.isNull(payload.PrimaryStoreId, 0) <= 0) {
        payload.PrimaryStoreId = null;
      }
      if (gsnApi.isNull(profile.ExternalId, '').length <= 0) {
        profile.ExternalId = null;
      }
      if (gsnApi.isNull(profile.FacebookUserId, '').length <= 0) {
        profile.FacebookUserId = null;
      }

      if (payload.UserName.length < 3) {
        deferred.resolve({
          success: false,
          response: 'Email/UserName must be at least 3 characters.'
        });
        return deferred.promise;
      }

      if (!isUpdate && (gsnApi.isNull(profile.FacebookToken, '').length <= 0)) {
        if (gsnApi.isNull(payload.Password, '').length < 6) {
          deferred.resolve({
            success: false,
            response: 'Password must be at least 6 characters.'
          });
          return deferred.promise;
        }
      }

      if (!gsnApi.getEmailRegEx().test(payload.Email)) {
        deferred.resolve({
          success: false,
          response: 'Email is invalid.'
        });
        return deferred.promise;
      }

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + (isUpdate ? "/Update" : "/Register");
        if (gsnApi.isNull(profile.FacebookToken, '').length > 1) {
          url += 'Facebook';
          payload.Password = profile.FacebookToken;
        }

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          // set current profile to response
          $savedData.profile = response;
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {

          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    }
    //#endregion

    return returnObj;
  }
})(angular);
