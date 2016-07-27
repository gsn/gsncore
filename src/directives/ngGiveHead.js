(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('ngGiveHead', [function() {
    // Usage: ability to add to head element.  Becareful, since only one element is valid, this should only be use in layout html.
    //
    // Creates: 2013-12-12 TomN
    //
    var directive = {
      restrict: 'EA',
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      // attempt to add element to head
      var el = angular.element('<' + attrs.ngGiveHead + '>');
      if (attrs.attributes) {
        var myAttrs = scope.$eval(attrs.attributes);
        angular.forEach(myAttrs, function(v, k) {
          el.attr(k, v);
        });
      }

      var pNode = angular.element('head')[0];
      pNode.insertBefore(el[0], angular.element('title')[0]);

      // When we go out of scope restore the original value.
      scope.$on('$destroy', function() {
        if (attrs.remove) {
          pnode.removeChild(el[0]);
        }
      });
    }
  }]);
})(angular);
