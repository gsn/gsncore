( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnTwitterShare', [ '$timeout', 'gsnApi', function ( $timeout, gsnApi ) {
    // Usage:   display twitter share
    //
    // Creates: 2014-01-06
    //
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link( scope, element, attrs ) {
      var defaults = {
        count: 'none'
      };
      var loadingScript = false;

      function loadShare() {

        if ( typeof twttr === 'undefined' ) {

          if ( loadingScript ) return;
          loadingScript = true;
          // dynamically load twitter
          var src = '//platform.twitter.com/widgets.js';
          gsnApi.loadScripts( [ src ], loadShare );
          return;
        }

        if ( element.html().length > 10 ) return;

        var options = scope.$eval( attrs.gsnTwitterShare );
        angular.extend( defaults, options );
        twttr.widgets.createShareButton(
          attrs.url,
          element[ 0 ],
          function ( el ) {}, defaults
        );

        return;
      }

      loadShare();
    }
  } ] );

} )( angular );
