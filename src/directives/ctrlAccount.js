(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlAccount';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnProfile', 'gsnApi', '$timeout', 'gsnStore', '$rootScope', '$analytics', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnProfile, gsnApi, $timeout, gsnStore, $rootScope, $analytics) {
    $scope.activate = activate;
    $scope.profile = {
      PrimaryStoreId: gsnApi.getSelectedStoreId(),
      ReceiveEmail: true
    };

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server
    $scope.profileStatus = {
      profileUpdated: 0
    };
    $scope.disableNavigation = false;
    $scope.profileUpdated = false;
    $scope.isFacebook = false;

    function activate() {
      gsnStore.getStores().then(function(rsp) {
        $scope.stores = rsp.response;
      });

      gsnProfile.getProfile().then(function(p) {
        if (p.success) {
          $scope.profile = angular.copy(p.response);
          $scope.isFacebook = (gsnApi.isNull($scope.profile.FacebookUserId, '').length > 0);
        }
      });

      $scope.profileUpdated = ($scope.currentPath === '/profile/rewardcard/updated');
    }

    $scope.updateProfile = function() {
      $scope.$broadcast('autofill:update');
      var profile = $scope.profile;
      if ($scope.myForm.$valid) {

        // prevent double submit
        if ($scope.isSubmitting) return;

        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        gsnProfile.updateProfile(profile)
          .then(function(result) {
            $scope.isSubmitting = false;
            $scope.isValidSubmit = result.success;
            if (result.success) {
              gsnApi.setSelectedStoreId(profile.PrimaryStoreId);
              // trigger profile retrieval
              gsnProfile.getProfile(true);

              // Broadcast the update.
              $rootScope.$broadcast('gsnevent:updateprofile-successful', result);
              $analytics.eventTrack('profile-update', {
                category: 'profile',
                label: result.response.ReceiveEmail
              });

              // If we have the cituation where we do not want to navigate.
              if (!$scope.disableNavigation) {
                $scope.goUrl('/profile/rewardcardupdate');
              }
            }
          });
      }
    };

    $scope.activate();

    ////
    // Handle the event
    ////
    $scope.$on('gsnevent:updateprofile-successful', function(evt, result) {

      // We just updated the profile; update the counter.
      $scope.profileStatus.profileUpdated++;
    });
  }

})(angular);
