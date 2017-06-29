( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.filter( 'pagingFilter', function () {
    // Usage: for doing paging, item in list | pagingFilter:2:1
    //

    return function ( input, pageSize, currentPage ) {
      return input ? input.slice( currentPage * pageSize, ( currentPage + 1 ) * pageSize ) : [];
    };
  } );

} )( angular );
