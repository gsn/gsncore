(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  var ngModifyElementDirective = function(opt) {
    // Usage: add meta dynamically
    //
    // Creates: 2013-12-12 TomN
    // 2014-06-22 TomN - fix global variable
    var options = angular.copy(opt);

    return myModule.directive(options.name, ['$timeout', 'gsnApi',
      function($timeout, gsnApi) {
        return {
          restrict: 'A',
          link: function(scope, e, attrs) {
            options.$timeout = $timeout;
            options.gsnApi = gsnApi;
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

            var $element = angular.element('head > ' + options.selector);
            if ($element.length <= 0 && typeof(options.html) === 'string') {
              angular.element('head > title').before(options.html);
              $element = angular.element('head > ' + options.selector);
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
              }
            });

            // When we go out of scope restore the original value.
            scope.$on('$destroy', function() {
              options.set($element, originalValue, currentValue);

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
    selector: 'meta[itemprop="title"]',
    html: '<meta itemprop="title" name="twitter:title" property="og:title"/>',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      angular.element('title').text(v);
      return e.attr('content', v);
    }
  });

  // page title
  ngModifyElementDirective({
    name: 'gsnMetaType',
    selector: 'meta[itemprop="type"]',
    html: '<meta content="article" itemprop="type" property="og:type"/>',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v || 'article');
    }
  });


  // description
  ngModifyElementDirective({
    name: 'gsnMetaDescription',
    selector: 'meta[itemprop="description"]',
    html: '<meta itemprop="description" name="twitter:description" property="og:description"/>',
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
    html: '<meta itemprop="image" name="twitter:image" property="og:image"/><meta content="300" property="og:image:width"/><meta content="300" property="og:image:height"/>',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      if (v) {
        if (v.indexOf('//') === 0) {
          v = 'https:' + v;
        }

        var $that = this;
        var iw = angular.element('head > meta[property="og:image:width"]').attr('content', '300');
        var ih = angular.element('head > meta[property="og:image:height"]').attr('content', '300');

        var setImageDimension = function(rst) {
          iw.attr('content', rst.w || 300);
          ih.attr('content', rst.h || 300);
        };

        $that.gsnApi.loadImage(v, setImageDimension);
      }

      return e.attr('content', v);
    }
  });

  // google site verification
  ngModifyElementDirective({
    name: 'gsnMetaGoogleSiteVerification',
    selector: 'meta[name="google-site-verification"]',
    html: '<meta name="google-site-verification" />',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });
})(angular);
