(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRecovery';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnProfile', 'gsnApi', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnProfile, gsnApi) {
    $scope.recoverPassword = doRecoveryPassword;
    $scope.recoverUsername = doRecoveryUsername;
    $scope.unsubscribeEmail = doUnsubscribeEmail;
    $scope.profile = {
      PrimaryStoreId: gsnApi.getSelectedStoreId(),
      ReceiveEmail: true
    };

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = false; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server

    //#region Internal Methods
    function doRecoveryPassword() {
      /// <summary>submit handler for recover password</summary>
      var payload = $scope.profile;
      if ($scope.myRecoveryForm.$valid) {
        payload.CaptchaChallenge = $scope.captcha.challenge;
        payload.CaptchaResponse = $scope.captcha.response;
        payload.ReturnUrl = $scope.getFullPath('/profile');
        payload.Email = $scope.profile.Email;
        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        gsnProfile.recoverPassword(payload).then(function(rsp) {
          $scope.isSubmitting = false;
          $scope.isValidSubmit = rsp.success;
        });
      }
    }

    function doRecoveryUsername() {
      /// <summary>submit handler for recover username</summary>
      var payload = $scope.profile;
      if ($scope.myRecoveryForm.$valid) {
        payload.ReturnUrl = $scope.getFullPath('/profile');
        payload.Email = $scope.profile.Email;
        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        gsnProfile.recoverUsername(payload).then(function(rsp) {
          $scope.isSubmitting = false;
          $scope.isValidSubmit = rsp.success;
        });
      }
    }

    function doUnsubscribeEmail() {
      /// <summary>submit handler for unsbuscribe to email</summary>
      var profile = $scope.profile;
      if ($scope.myRecoveryForm.$valid) {
        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        gsnProfile.unsubscribeEmail(profile.Email).then(function(rsp) {
          $scope.isSubmitting = false;
          $scope.isValidSubmit = rsp.success;
        });
      }
    }
    //#endregion
  }

})(angular);
