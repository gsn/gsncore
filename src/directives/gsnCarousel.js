(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnCarousel', ['gsnApi', '$timeout', '$window', function(gsnApi, $timeout, $window) {
    // Usage:   Display slides
    //
    // Creates: 2014-01-06
    //
    var directive = {
      link: link,
      restrict: 'EA',
      scope: true
    };
    return directive;

    function link(scope, element, attrs) {
      var options = {
          interval: attrs.interval,
          reverse: attrs.reverse || false
        },
        cancelRefresh,
        wasRunning = false,
        isPlaying = false;

      scope.$slideIndex = 0;
      scope.activate = activate;
      scope.slides = [];

      // determine if slide show is current playing
      scope.isPlaying = function() {
        return isPlaying;
      };

      // play slide show
      scope.play = function() {
        scope.stop();

        isPlaying = true;

        // set new refresh interval
        cancelRefresh = $timeout(scope.next, options.interval);
        return scope.$slideIndex;
      };

      // pause slide show
      scope.stop = function() {
        if (isPlaying) {
          if (gsnApi.isNull(cancelRefresh, null) !== null) {
            try {
              $timeout.cancel(cancelRefresh);
            } catch (e) {}
          }
        }

        isPlaying = false;
      };

      // go to next slide
      scope.next = function() {
        $timeout(function() {
          scope.$slideIndex = doIncrement(scope.play(), 1);
        }, 5);
      };

      // go to previous slide
      scope.prev = function() {
        $timeout(function() {
          scope.$slideIndex = doIncrement(scope.play(), -1);
        }, 5);
      };

      // go to specfic slide index
      scope.selectIndex = function(slideIndex) {
        $timeout(function() {
          scope.$slideIndex = slideIndex;
          return scope.play();
        }, 5);
      };

      // get the current slide
      scope.currentSlide = function() {
        return scope.slides[scope.currentIndex()];
      };

      // add slide
      scope.addSlide = function(slide) {
        return scope.slides.push(slide);
      };

      // remove a slide
      scope.removeSlide = function(slide) {
        //get the index of the slide inside the carousel
        var index = scope.indexOf(slide);
        return scope.slides.splice(index, 1);
      };

      // get a slide index
      scope.indexOf = function(slide) {
        if (typeof(slide.indexOf) !== 'undefined') {
          return slide.indexOf(slide);
        } else if (typeof(scope.slides.length) !== 'undefined') {
          // this is a loop because of indexOf does not work in IE
          for (var i = 0; i < scope.slides.length; i++) {
            if (scope.slides[i] === slide) {
              return i;
            }
          }
        }

        return -1;
      };

      // get current slide index
      scope.currentIndex = function() {
        var reverseIndex = (scope.slides.length - scope.$slideIndex - 1) % scope.slides.length;
        reverseIndex = (reverseIndex < 0) ? 0 : scope.slides.length - 1;

        return options.reverse ? reverseIndex : scope.$slideIndex;
      };

      // watch index and make sure it doesn't get out of range
      scope.$watch('$slideIndex', function(newValue) {
        var checkValue = doIncrement(scope.$slideIndex, 0);

        // on index change, make sure check value is correct
        if (checkValue !== newValue) {
          $timeout(function() {
            scope.$slideIndex = checkValue;
          }, 5);
        }
      });

      // cancel timer if it is running
      scope.$on('$destroy', scope.stop);

      scope.activate();

      //#region private functions
      // initialize
      function activate() {
        var slides = scope.$eval(attrs.slides);
        if (gsnApi.isNull(slides, []).length <= 0) {
          $timeout(activate, 200);
          return;
        }

        scope.slides = slides;
        scope.selectIndex(0);
        var win = angular.element($window);
        win.blur(function() {
          wasRunning = scope.isPlaying();
          scope.stop();
        });

        win.focus(function() {
          if (wasRunning) {
            scope.play();
          }
        });

        return;
      }

      // safe increment
      function doIncrement(slideIndex, inc) {
        var newValue = slideIndex + inc;
        newValue = ((newValue < 0) ? scope.slides.length - 1 : newValue) % scope.slides.length;
        return gsnApi.isNaN(newValue, 0);
      }
      //#endregion
    }
  }]);
})(angular);
