(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnLogin', ['gsnApi', '$route', '$location', 'gsnProfile', function(gsnApi, $route, $location, gsnProfile) {
    // Usage: login capability
    //
    // Creates: 2013-12-12 TomN
    //
    var directive = {
      restrict: 'EA',
      controller: ['$scope', '$element', '$attrs', controller]
    };
    return directive;

    function controller($scope, $element, $attrs) {
      $scope.activate = activate;
      $scope.profile = {};
      $scope.fromUrl = null;

      $scope.hasSubmitted = false; // true when user has click the submit button
      $scope.isValidSubmit = true; // true when result of submit is valid
      $scope.isSubmitting = false; // true if we're waiting for result from server

      function activate() {
        $scope.fromUrl = decodeURIComponent(gsnApi.isNull($location.search().fromUrl, ''));
      }

      $scope.$on('gsnevent:login-success', function(evt, result) {
        if ($scope.currentPath === '/signin') {
          if ($scope.fromUrl) {
            $location.url($scope.fromUrl);
          } else if ($scope.isLoggedIn) {
            $location.url('/');
          }
        } else {
          // reload the page to accept the login
          $route.reload();
        }

        $scope.$emit('gsnevent:closemodal');
      });

      $scope.$on('gsnevent:login-failed', function(evt, result) {
        $scope.isValidSubmit = false;
        $scope.isSubmitting = false;
      });

      $scope.login = function() {
        $scope.isSubmitting = true;
        $scope.hasSubmitted = true;
        gsnProfile.login($element.find('#usernameField').val(), $element.find('#passwordField').val());
      };
      $scope.activate();

      //#region Internal Methods
      //#endregion
    }
  }]);

})(angular);
