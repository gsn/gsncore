(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  var ngModifyElementDirective = function(opt) {
    // Usage: add meta dynamically
    //
    // Creates: 2013-12-12 TomN
    // 2014-06-22 TomN - fix global variable
    var options = angular.copy(opt);

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
    selector: 'title',
    get: function(e) {
      return e.text();
    },
    set: function(e, v) {
      return e.text(v);
    }
  });

  // viewpoint
  ngModifyElementDirective({
    name: 'gsnMetaViewport',
    selector: 'meta[name="viewport"]',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // author
  ngModifyElementDirective({
    name: 'gsnMetaAuthor',
    selector: 'meta[name="author"]',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
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

  // keywords
  ngModifyElementDirective({
    name: 'gsnMetaKeywords',
    selector: 'meta[name="keywords"]',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });


  // keywords
  ngModifyElementDirective({
    name: 'gsnMetaImage',
    selector: 'meta[name="image"]',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // keywords
  ngModifyElementDirective({
    name: 'gsnMetaName',
    selector: 'meta[name="name"]',
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

  // Facebook OpenGraph integration
  //  og:title - The title of your object as it should appear within the graph, e.g., "The Rock".
  ngModifyElementDirective({
    name: 'gsnOgTitle',
    selector: 'meta[property="og:title"]',
    html: '<meta property="og:title" content="" />',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // og:type - The type of your object, e.g., "movie". See the complete list of supported types.
  ngModifyElementDirective({
    name: 'gsnOgType',
    selector: 'meta[property="og:type"]',
    html: '<meta property="og:type" content="" />',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // og:image - An image URL which should represent your object within the graph. The image must be at least 50px by 50px and have a maximum aspect ratio of 3:1.
  ngModifyElementDirective({
    name: 'gsnOgImage',
    selector: 'meta[id="default-og-image"]',
    html: '<meta property="og:image" content="" id="default-og-image"/>',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // og:url - The canonical URL of your object that will be used as its permanent ID in the graph.
  ngModifyElementDirective({
    name: 'gsnOgUrl',
    selector: 'meta[property="og:url"]',
    html: '<meta property="og:url" content="" />',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });

  // og:description - the description.
  ngModifyElementDirective({
    name: 'gsnOgDescription',
    selector: 'meta[property="og:description"]',
    html: '<meta property="og:description" content="" />',
    get: function(e) {
      return e.attr('content');
    },
    set: function(e, v) {
      return e.attr('content', v);
    }
  });
})(angular);
