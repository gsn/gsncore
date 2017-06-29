( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.filter( 'trustedHtml', [ 'gsnApi', '$sce', function ( gsnApi, $sce ) {
    // Usage: allow for binding html
    //
    return function ( text ) {
      return $sce.trustAsHtml( text );
    };
  } ] );

} )( angular );
