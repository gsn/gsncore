(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRegistration';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnProfile', 'gsnApi', '$timeout', 'gsnStore', '$interpolate', '$http', '$rootScope', '$window', '$location', '$analytics', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnProfile, gsnApi, $timeout, gsnStore, $interpolate, $http, $rootScope, $window, $location, $analytics) {
    $scope.activate = activate;
    $scope.totalSavings = '';
    $scope.profile = {
      PrimaryStoreId: gsnApi.getSelectedStoreId(),
      ReceiveEmail: false
    };

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server
    $scope.isFacebook = $scope.currentPath === '/registration/facebook';
    $scope.errorMessage = '';
    var template;
    var templateUrl = $scope.isFacebook ? '/views/email/registration-facebook.html' : '/views/email/registration.html';
    var myTemplateUrl = $scope.getContentUrl(templateUrl);

    // try get template from content, if fail, get it from theme
    $http.get(myTemplateUrl)
      .success(function(response) {
        template = response.replace(/data-ctrl-email-preview/gi, '');
      }).error(function(response) {
        myTemplateUrl = $scope.getThemeUrl(templateUrl);
        $http.get(myTemplateUrl)
          .success(function(response) {
            template = response.replace(/data-ctrl-email-preview/gi, '');
          });
      });

    function activate() {
      if ($scope.isFacebook) {
        if (gsnApi.isNull($scope.facebookData.accessToken, '').length < 1) {
          $scope.goUrl('/');
          return;
        }

        var user = $scope.facebookData.user;
        $scope.profile.Email = user.email;
        $scope.profile.FirstName = user.first_name;
        $scope.profile.LastName = user.last_name;
      }

      gsnStore.getStores().then(function(rsp) {
        $scope.stores = rsp.response;
      });

    }

    $scope.registerProfile = function() {
      $scope.$broadcast('autofill:update');
      var payload = angular.copy($scope.profile);
      if ($scope.myForm.$valid) {

        // prevent double submit
        if ($scope.isSubmitting) return;

        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        $scope.errorMessage = '';

        // setup email registration stuff
        if ($scope.isFacebook) {
          payload.FacebookToken = $scope.facebookData.accessToken;
        }

        payload.ChainName = gsnApi.getChainName();
        payload.FromEmail = gsnApi.getRegistrationFromEmailAddress();
        payload.emailLogo = gsnApi.getRegistrationEmailLogo();
        payload.CopyrightYear = (new Date()).getFullYear();
        payload.UserName = gsnApi.isNull(payload.UserName, payload.Email);
        payload.WelcomeSubject = 'Welcome to ' + payload.ChainName + ' online.';

        $scope.email = payload;
        payload.WelcomeMessage = $interpolate(template.replace(/(data-ng-src)+/gi, 'src').replace(/(data-ng-href)+/gi, 'href'))($scope);

        gsnProfile.registerProfile(payload)
          .then(function(result) {
            $scope.isSubmitting = false;
            $scope.isValidSubmit = result.success;
            if (result.success) {
              $scope.isSubmitting = true;

              $rootScope.$broadcast('gsnevent:registration-successful', result);
              $analytics.eventTrack('profile-register', {
                category: 'registration',
                label: result.response.ReceiveEmail
              });

              // since we have the password, automatically login the user
              if ($scope.isFacebook) {
                gsnProfile.loginFacebook(result.response.UserName, payload.FacebookToken);
              } else {
                gsnProfile.login(result.response.UserName, payload.Password);
              }
            } else {
              if (result.response === 'Unexpected error occurred.') {
                $location.url('/maintenance');
              } else if (typeof(result.response) === 'string') {
                $scope.errorMessage = result.response;
              }
            }
          });
      }
    };

    $scope.$on('gsnevent:login-success', function(evt, result) {
      $scope.isSubmitting = false;
      if (gsnApi.isNull($scope.profile.ExternalId, '').length > 2) {
        $scope.goUrl('/profile/rewardcardupdate?registration=' + $scope.profile.ExternalId);
      } else {
        $timeout(gsnApi.reload, 500);
      }
      // otherwise, do nothing since isLoggedIn will show thank you message
    });

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }

})(angular);
