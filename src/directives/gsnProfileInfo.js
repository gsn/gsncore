(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnProfileInfo', ['gsnApi', 'gsnProfile', '$interpolate', function(gsnApi, gsnProfile, $interpolate) {
    // Usage: add profile info
    //
    // Creates: 2013-12-12 TomN
    // History:
    //          2015-02-27 TomN - add ability to interpolate gsnProfileInfo data
    //
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      var compiledTemplate;

      function setProfileData() {
        gsnProfile.getProfile().then(function(rst) {
          if (rst.success) {
            scope.profile = rst.response;
            element.html('');
            var html = '<p>welcome, ' + scope.profile.FirstName + ' ' + scope.profile.LastName + '</p>';
            if (attrs.gsnProfileInfo) {
              if (compiledTemplate === undefined) {
                compiledTemplate = $interpolate(attrs.gsnProfileInfo.replace(/\[+/gi, '{{').replace(/\]+/gi, '}}'));
              }
              html = compiledTemplate(scope);
            } else {
              if (scope.profile.FacebookUserId) {
                html = '<a href="/profile"><img alt="temp customer image" class="accountImage" src="https:\/\/graph.facebook.com\/' + scope.profile.FacebookUserId + '\/picture?type=small" \/><\/a>' + html;
              }
            }
            element.html(html);
          }
        });
      }

      setProfileData();
      scope.$on('gsnevent:profile-load-success', setProfileData);
    }
  }]);
})(angular);
