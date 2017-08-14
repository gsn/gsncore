(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnFluidVids', ['$sce', function($sce) {
    // Usage: add 3rd party videos
    //
    // Creates: 2013-12-12 TomN
    //
    var directive = {
      restrict: 'EA',
      replace: true,
      scope: true,
      link: link,
      template: '<div class="fluidvids">' +
        '<iframe data-ng-src="{{ video }}" allowfullscreen="" frameborder="0"></iframe>' +
        '</div>'
    };
    return directive;

    function link(scope, element, attrs) {
      element.on('scroll', function() {
        var ratio = (attrs.height / attrs.width) * 100;
        element[0].style.paddingTop = ratio + '%';
      });

      scope.video = $sce.trustAsResourceUrl(attrs.gsnFluidVids);
    }
  }]);
})(angular);
