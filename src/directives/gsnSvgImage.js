( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnSvgImage', [ '$window', '$timeout', 'debounce', function ( $window, $timeout, debounce ) {

    var directive = {
      link: link,
      restrict: 'A',
    };
    return directive;

    function link( scope, element, attrs ) {
      var src = attrs.src,
        svg;
      var width = 0,
        height = 0;

      var loadImage = function ( src, cb ) {
        var img = new Image();
        img.src = src;
        var error = null;
        img.onload = function () {
          cb( null, img );
        };
        img.onerror = function () {
          cb( 'ERROR LOADING IMAGE ' + src, null );
        };

      };

      function doLoadImage() {
        var $win = angular.element( $window );
        if ( attrs.src === '' ) {
          $timeout( doLoadImage, 200 );
          return;
        }

        loadImage( attrs.src, function ( err, img ) {
          if ( !err ) {
            element.html( '' );
            element.append( img );
            width = img.width || img.naturalWidth || img.offsetWidth;
            height = img.height || img.naturalHeight || img.offsetHeight;

            // set viewBox
            img = angular.element( attrs.gsnSvgImage );
            svg = img.parent( 'svg' );
            // append Image
            svg[ 0 ].setAttributeNS( '', 'viewBox', '0 0 ' + width + ' ' + height + '' );
            img.attr( 'width', width ).attr( 'height', height ).attr( 'xlink:href', attrs.src );
            img.show();
            var isIE = /Trident.*rv:11\.0/.test( navigator.userAgent ) || /msie/gi.test( navigator.userAgent );

            if ( isIE && attrs.syncHeight ) {
              var resizer = debounce( function () {
                var actualWidth = element.parent().width();
                var ratio = actualWidth / ( width || actualWidth || 1 );
                var newHeight = ratio * height;

                angular.element( attrs.syncHeight ).height( newHeight );

              }, 200 );

              resizer();
              $win.on( 'resize', resizer );
            }

            // re-adjust
            var reAdjust = debounce( function () {
              // click activate to re-arrange item
              angular.element( '.onlist' ).click();

              // remove active item
              $timeout( function () {
                scope.vm.activeItem = null;
                scope.vm.loadCount++;
              }, 200 );
            }, 200 );
            reAdjust();

            $win.on( 'resize', reAdjust );
            $win.on( 'orientationchange', reAdjust );
          }
        } );
      }
      var myLoadImage = debounce( doLoadImage, 100 );
      scope.$watch( attrs.watch || 'vm.page', myLoadImage );
    }
  } ] );
} )( angular );
