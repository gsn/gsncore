(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlEmailPreview';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', 'gsnProfile', '$location', myController])
    .directive(myDirectiveName, myDirective);

  // directive for previewing email
  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi, gsnProfile, $location) {
    $scope.activate = activate;
    $scope.email = {};

    function activate() {
      gsnProfile.getProfile().then(function(p) {
        if (p.success) {
          var profile = gsnApi.isNull(angular.copy(p.response), {});

          var email = $scope.email;
          email.FirstName = profile.FirstName;
          email.ChainName = gsnApi.getChainName();
          email.CopyrightYear = (new Date()).getFullYear();
          email.FromEmail = gsnApi.getRegistrationFromEmailAddress();
          angular.copy($location.search(), email);
        }
      });
    }

    $scope.activate();
  }
})(angular);
