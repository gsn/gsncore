(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlChangePassword';

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
    $scope.activate = activate;
    $scope.profile = {
      PrimaryStoreId: gsnApi.getSelectedStoreId(),
      ReceiveEmail: true
    };

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server

    function activate() {
      gsnProfile.getProfile().then(function(p) {
        if (p.success) {
          $scope.profile = angular.copy(p.response);
        }
      });
    }

    $scope.changePassword = function() {
      var profile = $scope.profile;
      if ($scope.myForm.$valid) {

        // prevent double submit
        if ($scope.isSubmitting) return;

        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        gsnProfile.changePassword(profile.UserName, profile.currentPassword, profile.newPassword)
          .then(function(result) {
            $scope.isSubmitting = false;
            $scope.isValidSubmit = result.success;
          });
      }
    };

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }
})(angular);
