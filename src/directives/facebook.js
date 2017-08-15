(function(angular, undefined) {
  var createDirective, module, pluginName, _i, _len, _ref;

  module = angular.module('gsn.core');

  createDirective = function(name) {
    return module.directive(name, ['$timeout', function($timeout) {
      return {
        restrict: 'AC',
        link: function(scope, element, attrs) {
          function loadPlugin() {
            if (typeof FB !== 'undefined' && FB !== null) {
              FB.XFBML.parse(element.parent()[0]);
            } else {
              $timeout(loadPlugin, 500);
            }
          }

          $timeout(loadPlugin, 500);
        }
      };
    }]);
  };

  _ref = ['fbActivity', 'fbComments', 'fbFacepile', 'fbLike', 'fbLikeBox', 'fbLiveStream', 'fbLoginButton', 'fbName', 'fbProfilePic', 'fbRecommendations'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    pluginName = _ref[_i];
    createDirective(pluginName);
  }

})(angular);
