( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnTwitterTimeline', [ '$timeout', 'gsnApi', function ( $timeout, gsnApi ) {
    // Usage:   display twitter timeline
    //
    // Creates: 2014-01-06
    //
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link( scope, element, attrs ) {
      var loadingScript = false;
      element.html( '<a class="twitter-timeline" href="' + attrs.href + '" data-widget-id="' + attrs.gsnTwitterTimeline + '">' + attrs.title + '</a>' );

      function loadTimeline() {
        if ( typeof twttr === 'undefined' ) {
          if ( loadingScript ) return;
          loadingScript = true;

          // dynamically load twitter
          var src = '//platform.twitter.com/widgets.js';
          gsnApi.loadScripts( [ src ], loadTimeline );
          return;
        }

        twttr.widgets.load();
        return;
      }

      loadTimeline();
    }
  } ] );

} )( angular );
