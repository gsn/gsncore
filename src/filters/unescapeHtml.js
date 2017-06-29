( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.filter( 'unescapeHtml', [ function () {
    // Usage: allow for escaping html
    //
    return function ( text, escape ) {
      return escape ? escape( text ) : unescape( text );
    };
  } ] );

} )( angular );
