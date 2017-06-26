(function(angular, $, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  var ngModifyElementDirective = function(opt) {
    // Usage: add meta dynamically
    //
    // Creates: 2013-12-12 TomN
    // 2014-06-22 TomN - fix global variable
    var options = angular.copy(opt);

    // dummy function if none defined
    if (!options.on) {
      options.on = function() {}
    }

    return myModule.directive(options.name, [
      function() {
        return {
          restrict: 'A',
          link: function(scope, e, attrs) {
            var modifierName = '$' + options.name;

            // Disable parent modifier so that it doesn't
            // overwrite our changes.
            var parentModifier = scope[modifierName];
            var parentModifierWasEnabled;
            if (parentModifier) {
              parentModifierWasEnabled = parentModifier.isEnabled;
              parentModifier.isEnabled = false;
            }

            // Make sure we haven't attached this directive
            // to this scope yet.
            if (scope.hasOwnProperty(modifierName)) {
              throw {
                name: 'ScopeError',
                message: 'Multiple copies of ' + options.name + ' modifier in same scope'
              };
            }

            // Attach to the current scope.
            var currentModifier = {
              isEnabled: true
            };
            scope[modifierName] = currentModifier;

            var $element = angular.element(options.selector);
            if ($element.length <= 0 && typeof (options.html) == 'string') {
              $element = angular.element(options.html);
              var pNode = angular.element('head')[0];
              pNode.insertBefore($element[0], angular.element('title')[0]);
            }

            // Keep track of the original value, so that it
            // can be restored later.
            var originalValue = options.get($element);

            // Watch for changes to the interpolation, and reflect
            // them into the DOM.
            var currentValue = originalValue;
            attrs.$observe(options.name, function(newValue, oldValue) {
              // Don't stomp on child modifications if *we* disabled.
              if (currentModifier.isEnabled) {
                currentValue = newValue;
                options.set($element, newValue, oldValue);
                options.on('activated', scope, $element, attrs, newValue, oldValue);
              }
            });

            // When we go out of scope restore the original value.
            scope.$on('$destroy', function() {
              options.set($element, originalValue, currentValue);
              options.on('destroyed', scope, $element, attrs, newValue, oldValue);

              // Turn the parent back on, if it indeed was on.
              if (parentModifier) {
                parentModifier.isEnabled = parentModifierWasEnabled;
              }
            });

          }
        };
      }
    ]);
  };

  // page title
  ngModifyElementDirective({
    name: 'gsnTitle',
    selector: '[name="title"]',
    get: function(e) {
      return e.text();
    },
    set: function(e, v) {
      return e.text(v);
    }
  });

  // page title
  ngModifyElementDirective({
    name: 'gsnMetaType',
    selector: 'meta[itemprop="type"]',
    get: function(e) {
      return e.text();
    },
    set: function(e, v) {
      return e.text(v || "article");
    }
  });


  // description
  ngModifyElementDirective({
    name: 'gsnMetaDescription',
    selector: 'meta[name="description"]',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // image
  ngModifyElementDirective({
    name: 'gsnMetaImage',
    selector: 'meta[itemprop="image"]',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // google site verification
  ngModifyElementDirective({
    name: 'gsnMetaGoogleSiteVerification',
    selector: 'meta[name="google-site-verification"]',
    html: '<meta name="google-site-verification" content="" />',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });
})(angular, jQuery);
