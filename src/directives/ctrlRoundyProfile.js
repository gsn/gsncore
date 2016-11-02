(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRoundyProfile';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnRoundyProfile', 'gsnProfile', '$modal', '$location', '$rootScope', '$window', '$timeout', 'gsnApi', '$analytics', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnRoundyProfile, gsnProfile, $modal, $location, $rootScope, $window, $timeout, gsnApi, $analytics) {
    $scope.isLoading = false;
    $scope.activate = activate;
    $scope.updateProfile = updateProfile;
    $scope.saveProfile = saveProfile;
    $scope.changePhoneNumber = changePhoneNumber;
    $scope.goChangeCardScreen = goChangeCardScreen;
    $scope.profile = null;
    $scope.validateErrorMessage = null;
    $scope.modalInstance = null;
    $scope.ignoreChanges = false;
    $scope.goOutPrompt = goOutPrompt;
    $scope.goOutPromt = goOutPrompt;
    $scope.$parent.$parent.$parent.goOutPrompt = $scope.goOutPrompt;
    $scope.$parent.$parent.$parent.goOutPromt = $scope.goOutPrompt;

  

    function activate() {
      if (!$scope.isLoggedIn) return;
      $scope.isLoading = true;
      gsnRoundyProfile.getProfile(true).then(function(rsp) {
        if (!rsp.success)
          $location.url('/maintenance');

        $scope.isLoading = false;
        $scope.updateProfile();
      });
      gsnStore.getStores().then(function(rsp) {
        $scope.stores = rsp.response;
      });

      gsnStore.getStates().then(function(rsp) {
        $scope.states = rsp.response;
      });
    }

    $scope.$on("$locationChangeStart", function(event, next, current) {
      if ($scope.ignoreChanges) return;
      $scope.goOutPrompt(event, next, goNext, false);
    });

    $scope.$on("$locationChangeSuccess", function() {
      if ($scope.modalInstance)
        $scope.modalInstance.close();
    });

    $scope.$watch("profile.PostalCode", function(newValue) {
      if (newValue) {
        var pat = /^[0-9]{5}(?:[0-9]{4})?$/;
        $scope.MyForm.zipcode.$setValidity('', pat.test(newValue));
      } else if ($scope.MyForm.zipcode) {
        $scope.MyForm.zipcode.$setValidity('', true);
      }
    });

    $scope.$on('$destroy', function() {
      $scope.$parent.$parent.$parent.goOutPrompt = null;
    });

    $scope.activate();

    //#region Internal Methods  

    function goOutPrompt(event, next, callBack, forceAction) {
      if ($scope.MyForm.$dirty) {
        if (event)
          event.preventDefault();
        $scope.ignoreChanges = $window.confirm("All unsaved changes will be lost. Continue?");
        if ($scope.ignoreChanges) {
          callBack(next);
        }
      } else if (forceAction) {
        callBack(next);
      }
    }

    function goNext(next) {
      $timeout(function() {
        $location.url(next.replace(/^(?:\/\/|[^\/]+)*\//, ""));
      }, 5);
    }

    function updateProfile() {
      $scope.profile = gsnRoundyProfile.profile;
      gsnProfile.getProfile().then(function(rst) {
        if (rst.success) {
          var profile = rst.response;
          if ($scope.profile.FirstName)
            profile.FirstName = $scope.profile.FirstName;
          if ($scope.profile.LastName)
            profile.LastName = $scope.profile.LastName;
          profile.PrimaryStoreId = $scope.profile.PrimaryStoreId;
          profile.ExternalId = $scope.profile.ExternalId;
          $rootScope.$broadcast('gsnevent:profile-load-success', {
            success: true,
            response: profile
          });
        }
      });
    }

    function saveProfile() {
      $scope.$broadcast("autofill:update");
      $scope.validateErrorMessage = null;
      $scope.isLoading = true;
      var payload = angular.copy($scope.profile);

      gsnRoundyProfile.saveProfile(payload).then(function(rsp) {
        $scope.isLoading = false;
        $scope.MyForm.$dirty = false;
        if (rsp.response && rsp.response.ExceptionMessage == "Profile Id is required.")
          $location.url('/maintenance');else if (rsp.response && rsp.response.ExceptionMessage)
          $scope.validateErrorMessage = rsp.response.ExceptionMessage;else if (rsp.response && rsp.response.Message)
          $scope.validateErrorMessage = rsp.response.Message; else {
          $scope.updateProfile();
          $scope.updateSuccessful = true;

          $analytics.eventTrack('profile-update', {
            category: 'profile',
            label: rsp.response.ReceiveEmail
          });
        }
      });
    }

    function changePhoneNumber() {
      $scope.modalInstance = $modal.open({
        templateUrl: gsn.getThemeUrl('/views/roundy-profile-phonenumber.html'),
        controller: 'ctrlRoundyProfileChangePhoneNumber',
        resolve: {
          gsnRoundyProfile: function() {
            return gsnRoundyProfile;
          }
        }
      });

      $scope.modalInstance.result.then(function() {
        $scope.updateProfile();
      }, function() {
        // console.log('Cancelled');
      })['finally'](function() {
        $scope.modalInstance = undefined;
      });
    }

    function goChangeCardScreen(isECard) {

      $scope.isLoading = true;
      $scope.validateErrorMessage = null;
      var payload = angular.copy($scope.profile);

      gsnRoundyProfile.saveProfile(payload).then(function(rsp) {
        $scope.isLoading = false;
        $scope.MyForm.$dirty = false;
        if (rsp.response && rsp.response.ExceptionMessage == "Profile Id is required.")
          $location.url('/maintenance');else if (rsp.response && rsp.response.ExceptionMessage)
          $scope.validateErrorMessage = rsp.response.ExceptionMessage;else if (rsp.response && rsp.response.Message)
          $scope.validateErrorMessage = rsp.response.Message; else {
          $scope.updateProfile();
          openChangeCardScreen(isECard);
        }
      });

    }


    function openChangeCardScreen(isECard) {
      var url = isECard ? '/views/e-fresh-perks-registration.html' : '/views/fresh-perks-registration.html';

      $scope.modalInstance = $scope.modalInstance = $modal.open({
        templateUrl: gsn.getThemeUrl(url),
        controller: 'ctrlFreshPerksCardRegistration',
      });

      $scope.modalInstance.result.then(function() {
        $scope.updateProfile();
      }, function() {
        // console.log('Cancelled');
      })['finally'](function() {
        $scope.modalInstance = undefined;
      });
    }

  //#endregion
  }

  angular.module('gsn.core').controller('ctrlRoundyProfileChangePhoneNumber', ['$scope', '$modalInstance', 'gsnRoundyProfile',
    function($scope, $modalInstance, gsnRoundyProfile) {
      $scope.input = {};
      $scope.input.PhoneNumber = gsnRoundyProfile.profile.Phone;
      $scope.isECard = gsnRoundyProfile.profile.IsECard;

      if ($scope.input.PhoneNumber && $scope.input.PhoneNumber.length != 10) {
        $scope.validateErrorMessage = 'Phone number must be 10 digits long';
      }
      $scope.remove = function() {
        //removing
        $scope.isLoading = true;
        gsnRoundyProfile.removePhone().then(function() {
          $scope.isLoading = false;
          $modalInstance.close();
        });
      };

      $scope.save = function() {
        $scope.isLoading = true;
        gsnRoundyProfile.savePhonNumber($scope.input.PhoneNumber).then(function(rsp) {
          $scope.isLoading = false;
          if (rsp.response.Success) {
            gsnRoundyProfile.profile.Phone = $scope.input.PhoneNumber;
            $modalInstance.close();
          } else {
            $scope.validateErrorMessage = rsp.response.Message;
            $scope.input.PhoneNumber = gsnRoundyProfile.profile.Phone;
          }

        });
      };

      $scope.cancel = function() {
        $modalInstance.close();
      };


    }]);

  angular.module('gsn.core').controller('ctrlNotificationWithTimeout', ['$scope', '$modalInstance', '$timeout', 'message', 'background',
    function($scope, $modalInstance, $timeout, message, background) {
      $scope.message = message;
      $scope.style = {
        'background-color': background,
        'color': '#ffffff',
        'text-align': 'center',
        'font-size': 'x-large',
      };
      $timeout(function() {
        $modalInstance.dismiss('cancel');
      }, 1000);
    }]);

  angular.module('gsn.core').controller('ctrlFreshPerksCardRegistration', ['$scope', '$modalInstance', 'gsnRoundyProfile', '$timeout', 'gsnApi', '$location', 'gsnStore',
    function($scope, $modalInstance, gsnRoundyProfile, $timeout, gsnApi, $location, gsnStore) {
      $scope.profile = null;
      $scope.foundProfile = null;
      $scope.input = {};
      $scope.newCardForm = {};
      $scope.setNewCardFormScope = setNewCardFormScope;
      $scope.input.updateProfile = false;
      $scope.activate = activate;
      $scope.validateCardNumber = validateCardNumber;
      $scope.showMismatchErrorMessage = false;
      $scope.goAddCardScreen = goAddCardScreen;
      $scope.goNewCardScreen = goNewCardScreen;
      $scope.goFoundCardScreen = goFoundCardScreen;
      $scope.mergeAccounts = mergeAccounts;
      $scope.registerLoyaltyCard = registerLoyaltyCard;
      $scope.registerELoyaltyCard = registerELoyaltyCard;
      $scope.removeLoyaltyCard = removeLoyaltyCard;
      $scope.close = close;
      $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-add.html');
      $scope.validateErrorMessage = null;

      function activate() {
        $scope.foundProfile = angular.copy(gsnRoundyProfile.profile);
        gsnStore.getStores().then(function(rsp) {
          $scope.stores = rsp.response;
        });

        gsnStore.getStates().then(function(rsp) {
          $scope.states = rsp.response;
        });

        $scope.$watch("foundProfile.PostalCode", function(newValue) {
          if ($scope.newCardForm.MyForm) {
            if (newValue) {
              var pat = /^[0-9]{5}(?:[0-9]{4})?$/;
              $scope.newCardForm.MyForm.zipcode.$setValidity('', pat.test(newValue));
            } else {
              $scope.newCardForm.MyForm.zipcode.$setValidity('', true);
            }
          }
        });

      }

      function validateCardNumber() {
        $scope.isLoading = true;
        gsnRoundyProfile.validateLoyaltyCard($scope.foundProfile.FreshPerksCard).then(function(result) {
          if (result.response.Success) {
            // Possible values are: ExactMatch, SameCustomer, Unregistered, Mismatch
            switch (result.response.Response.ValidationResult) {
              case "SameCustomer":
                //Found
                $scope.foundProfile = result.response.Response.Profile;
                $scope.foundProfile.FreshPerksCard = $scope.foundProfile.ExternalId;
                $scope.input.updateProfile = true;
                goFoundCardScreen();
                break;
              case "ExactMatch":
                gsnRoundyProfile.associateLoyaltyCardToProfile($scope.foundProfile.FreshPerksCard).then(function(rslt) {
                  //TODO: check errors 
                  gsnRoundyProfile.profile.FreshPerksCard = $scope.foundProfile.FreshPerksCard;
                  gsnRoundyProfile.profile.ExternalId = $scope.foundProfile.FreshPerksCard;
                  gsnRoundyProfile.profile.IsECard = false;
                  close();
                });
                break;
              case "Unregistered":
                $scope.foundProfile = angular.copy(gsnRoundyProfile.profile);
                $scope.foundProfile.ExternalId = result.response.Response.Profile.ExternalId;
                $scope.foundProfile.FreshPerksCard = result.response.Response.Profile.ExternalId;
                goNewCardScreen();
                break;
              case "Mismatch":
                //Error
                $scope.isLoading = false;
                $scope.showMismatchErrorMessage = true;
                break;
              default:
                $scope.isLoading = false;
                $scope.validateErrorMessage = result.response.Message;
            }
          } else if (result.response && result.response.Message) {
            $scope.isLoading = false;
            $scope.validateErrorMessage = result.response.Message;
          }
        });
      }

      function removeLoyaltyCard() {
        $scope.isLoading = true;
        gsnRoundyProfile.removeLoyaltyCard().then(function(result) {
          if (!result.response.Success) {
            $scope.isLoading = false;
            $scope.validateErrorMessage = 'Loyalty Card can not be removed now';
          } else {
            gsnRoundyProfile.profile.FreshPerksCard = null;
            gsnRoundyProfile.profile.ExternalId = null;
            $scope.isLoading = false;
            $scope.close();
          }
        });
      }

      function mergeAccounts() {
        $scope.isLoading = true;
        gsnRoundyProfile.mergeAccounts($scope.foundProfile.ExternalId, $scope.input.updateProfile).then(function(result) {
          if (!result.response.Success) {
            $scope.isLoading = false;
            $scope.validateErrorMessage = result.response.Message;
          } else {
            gsnRoundyProfile.profile = gsnRoundyProfile.getProfile(true).then(function() {
              $scope.isLoading = false;
              $scope.close();
            });
          }
        });
      }

      function registerLoyaltyCard() {
        $scope.isLoading = true;
        gsnRoundyProfile.registerLoyaltyCard($scope.foundProfile).then(function(result) {
          $scope.isLoading = false;
          if (!result.response.Success) {
            $scope.validateErrorMessage = result.response.Message;
          } else {
            gsnRoundyProfile.profile = $scope.foundProfile;
            gsnRoundyProfile.profile.IsECard = false;
            close();
          }
        });
      }

      function registerELoyaltyCard() {
        $scope.isLoading = true;
        gsnRoundyProfile.registerELoyaltyCard($scope.foundProfile).then(function(result) {
          $scope.isLoading = false;
          if (!result.response.Success) {
            $scope.validateErrorMessage = result.response.Message;
          } else {
            gsnRoundyProfile.profile = $scope.foundProfile;
            gsnRoundyProfile.profile.IsECard = true;
            gsnRoundyProfile.profile.FreshPerksCard = result.response.Response.LoyaltyECardNumber;
            gsnRoundyProfile.profile.ExternalId = result.response.Response.LoyaltyECardNumber;
            close();
          }
        });
      }

      function setNewCardFormScope(scope) {
        $scope.newCardForm = scope;
      }

      $scope.activate();

      //#region Internal Methods  


      function goAddCardScreen() {
        resetBeforeRedirect();
        $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-add.html');
      }

      function goNewCardScreen() {
        resetBeforeRedirect();
        $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-new.html');
      }

      function goFoundCardScreen() {
        resetBeforeRedirect();
        $scope.currentView = gsnApi.getThemeUrl('/views/fresh-perks-registration-found.html');
      }

      function resetBeforeRedirect() {
        $scope.isLoading = false;
        $scope.validateErrorMessage = null;
        $scope.showMismatchErrorMessage = false;
      }

      function close() {
        resetBeforeRedirect();
        $timeout(function() {
          $modalInstance.close();
        //$location.url('/myaccount');
        }, 500);

      }

    //#endregion
    }]);
})(angular);
