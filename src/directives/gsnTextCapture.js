( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnTextCapture', [ '$window', '$timeout', function ( $window, $timeout ) {
    // Usage:   bind text back into some property
    //
    // Creates: 2014-01-06
    //
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link( scope, element, attrs ) {
      var timeout = parseInt( attrs.timeout );
      var continousMonitor = timeout > 0;

      if ( timeout <= 0 ) {
        timeout = 200;
      }

      var refresh = function () {
        scope.$apply( attrs.gsnTextCapture + ' = "' + element.text().replace( /"/g, '\\"' ).replace( /(ie8newlinehack)/g, '\r\n' ) + '"' );
        var val = scope.$eval( attrs.gsnTextCapture );
        var noData = val.replace( /\s+/gi, '' ).length <= 0;
        if ( noData ) {
          $timeout( refresh, timeout );
          return;
        }

        if ( continousMonitor ) {
          $timeout( refresh, timeout );
        }
      };

      $timeout( refresh, timeout );
    }
  } ] );
} )( angular );
