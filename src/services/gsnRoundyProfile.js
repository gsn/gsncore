(function(angular, undefined) {
  'use strict';
  var serviceId = 'gsnRoundyProfile';
  angular.module('gsn.core').service(serviceId, ['gsnApi', '$http', '$q', '$rootScope', '$timeout', '$analytics', gsnRoundyProfile]);

  function gsnRoundyProfile(gsnApi, $http, $q, $rootScope, $timeout, $analytics) {

    var returnObj = {};

    returnObj.profile = {};
    returnObj.getProfileDefer = null;

    function init() {
      returnObj.profile = {
        Email: null,
        PrimaryStoreId: null,
        FirstName: null,
        LastName: null,
        Phone: null,
        AddressLine1: null,
        AddressLine2: null,
        City: null,
        State: null,
        PostalCode: null,
        FreshPerksCard: null,
        ReceiveEmail: false,
        Id: null,
        IsECard: false
      };
    }

    init();

    returnObj.saveProfile = function(profile) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/SaveProfile/' + gsnApi.getChainId();

        if (profile.PostalCode) {
          profile.PostalCode = profile.PostalCode.substr(0, 5);
        }
        $http.post(url, profile, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });

          $rootScope.$broadcast('gsnevent:updateprofile-successful', response);
          $analytics.eventTrack('profile-update', {
            category: 'profile',
            label: response.ReceiveEmail
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.validateLoyaltyCard = function(loyaltyCardNumber) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/ValidateLoyaltyCard/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '?loyaltyCardNumber=' + loyaltyCardNumber;
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.removeLoyaltyCard = function(profileId) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/RemoveLoyaltyCard/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId();
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.getProfile = function(force) {
      var returnDefer;
      if (returnObj.profile.FirstName && !force) {
        returnDefer = $q.defer();
        $timeout(function() {
          returnDefer.resolve({
            success: true,
            response: returnObj.profile
          });
        }, 500);
      } else if (returnObj.getProfileDefer) {
        returnDefer = returnObj.getProfileDefer;
      } else {
        returnObj.getProfileDefer = $q.defer();
        returnDefer = returnObj.getProfileDefer;
        gsnApi.getAccessToken().then(function() {
          var url = gsnApi.getRoundyProfileUrl() + '/GetProfile/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId();
          $http.get(url, {
            headers: gsnApi.getApiHeaders()
          }).success(function(response) {
            returnObj.profile = response;
            if (response.ExternalId)
              returnObj.profile.FreshPerksCard = response.ExternalId;
            if (response.PostalCode)
              while (returnObj.profile.PostalCode.length < 5) {
                returnObj.profile.PostalCode += '0';
            }
            returnDefer.resolve({
              success: true,
              response: response
            });
            returnObj.getProfileDefer = null;
          }).error(function(response) {
            errorBroadcast(response, returnDefer);
          });
        });
      }
      return returnDefer.promise;
    };

    returnObj.mergeAccounts = function(newCardNumber, updateProfile) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/MergeAccounts/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '?newCardNumber=' + newCardNumber + '&updateProfile=' + updateProfile;
        $http.post(url, {}, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.removePhone = function() {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/SavePhoneNumber/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '?phoneNumber=' + '';
        $http.post(url, {}, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          returnObj.profile.Phone = null;
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.savePhonNumber = function(phoneNumber) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/SavePhoneNumber/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '?phoneNumber=' + phoneNumber;
        $http.post(url, {}, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.isValidPhone = function(phoneNumber) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/IsValidPhone/' + gsnApi.getChainId() + '/' + returnObj.profile.FreshPerksCard + '?phone=' + phoneNumber;
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.profileByCardNumber = function(cardNumber) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/ProfileBy/' + gsnApi.getChainId() + '/' + cardNumber;
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          if (typeof response == 'object' && response.FirstName) {
            deferred.resolve({
              success: true,
              response: response
            });
          } else {
            errorBroadcast(response, deferred);
          }
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.registerLoyaltyCard = function(profile) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/RegisterLoyaltyCard/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId();
        if (profile.PostalCode) {
          profile.PostalCode = profile.PostalCode.substr(0, 5);
        }
        $http.post(url, profile, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.registerELoyaltyCard = function(profile) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/RegisterELoyaltyCard/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId();
        if (profile.PostalCode) {
          profile.PostalCode = profile.PostalCode.substr(0, 5);
        }
        $http.post(url, profile, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.associateLoyaltyCardToProfile = function(cardNumber) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/AssociateLoyaltyCardToProfile/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '?loyaltyCardNumber=' + cardNumber;
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    returnObj.addOffer = function(offerId) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getRoundyProfileUrl() + '/AddOffer/' + gsnApi.getProfileId() + '/' + offerId;
        $http.post(url, {}, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          errorBroadcast(response, deferred);
        });
      });
      return deferred.promise;
    };

    $rootScope.$on('gsnevent:logout', function() {
      init();
    });

    return returnObj;

    function errorBroadcast(response, deferred) {
      deferred.resolve({
        success: false,
        response: response
      });
      $rootScope.$broadcast('gsnevent:roundy-error', {
        success: false,
        response: response
      });
    }
  }
})(angular);
