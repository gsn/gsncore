( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnSiteSearch', [ '$routeParams', '$timeout', 'gsnApi', '$window', function ( $routeParams, $timeout, gsnApi, $window ) {
    // Usage:   site search control
    //
    // Creates: 2014-01-09
    //
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link( scope, element, attrs ) {
      var loadingScript = false;

      function loadSearch() {
        if ( undefined === $window.google || undefined === $window.google.load ) {
          $timeout( loadSearch, 500 );

          if ( loadingScript ) return;

          loadingScript = true;

          // dynamically load google
          var src = '//www.google.com/jsapi';

          gsnApi.loadScripts( [ src ], loadSearch );
          return;
        }

        google.load( 'search', '1', {
          language: 'en',
          callback: function () {
            var customSearchControl = new google.search.CustomSearchControl( gsnApi.getGoogleSiteSearchCode() );
            customSearchControl.setResultSetSize( google.search.Search.FILTERED_CSE_RESULTSET );
            customSearchControl.setLinkTarget( google.search.Search.LINK_TARGET_SELF );
            customSearchControl.draw( attrs.id );
            if ( attrs.query ) {
              customSearchControl.execute( $routeParams[ attrs.query ] );
            }
          }
        } );

        return;
      }


      $timeout( loadSearch, 500 );
    }
  } ] );
} )( angular );
