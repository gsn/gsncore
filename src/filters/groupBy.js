( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.filter( 'groupBy', [ 'gsnApi', function ( gsnApi ) {
    // Usage: for doing grouping
    //

    return function ( input, attribute ) {
      return gsnApi.groupBy( input, attribute );
    };
  } ] );

} )( angular );
