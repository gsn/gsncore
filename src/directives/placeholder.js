(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('placeholder', ['$timeout', 'gsnApi', function($timeout, gsnApi) {
    return function(scope, el, attrs) {
      var settings = {
          cssClass: 'placeholder',
          excludedAttrs: ['placeholder', 'name', 'id', 'ng-model', 'type']
        },
        placeholderText = attrs.placeholder,
        isPassword = attrs.type === 'password',
        hasNativeSupport = 'placeholder' in document.createElement('input') && 'placeholder' in document.createElement('textarea'),
        setPlaceholder, removePlaceholder, copyAttrs, fakePassword;

      if (hasNativeSupport) return;

      copyAttrs = function() {
        var a = {};
        angular.forEach(attrs.$attr, function(i, attrName) {
          if (!gsn.contains(settings.excludedAttrs, attrName)) {
            a[attrName] = attrs[attrName];
          }
        });
        return a;
      };

      var createFakePassword = function() {
        return angular.element('<input>', angular.extend(copyAttrs(), {
            'type': 'text',
            'value': placeholderText
          }))
          .addClass(settings.cssClass)
          .bind('focus', function() {
            removePlaceholder();
          })
          .insertBefore(el);
      };

      if (isPassword) {
        fakePassword = createFakePassword();
        setPlaceholder = function() {
          if (!el.val()) {
            fakePassword.show();
            el.hide();
          }
        };
        removePlaceholder = function() {
          if (fakePassword.is(':visible')) {
            fakePassword.hide();
            el.show().focus();
          }
        };
      } else {
        setPlaceholder = function() {
          if (!el.val()) {
            el.val(placeholderText);

            $timeout(function() {
              el.addClass(settings.cssClass); /*hint, IE does not aplly style without timeout*/
            }, 0);
          }
        };

        removePlaceholder = function() {
          if (el.hasClass(settings.cssClass)) {
            el.val('').select(); /*trick IE, because after tabbing focus to input, there is no cursor in it*/
            el.removeClass(settings.cssClass);
          }
        };
      }

      el.on('focus', removePlaceholder).on('blur', setPlaceholder);
      $timeout(function() {
        el.trigger('blur');
      }, 0);


      scope.$watch(attrs.ngModel, function(value) {
        if (gsnApi.isNull(value).length <= 0) {
          if (!el.is(':focus')) el.trigger('blur');
        } else {
          if (el.hasClass(settings.cssClass)) el.removeClass(settings.cssClass);
        }
      });

    };
  }]);
})(angular);
