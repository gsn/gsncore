( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  /**
   * This directive help dynamically create a list of numbers.
   * usage: data-ng-repeat="n in [] | range:1:5"
   * @directive range
   */
  myModule.filter( 'range', [ function () {
    return function ( input, min, max ) {
      min = parseInt( min ); //Make string input int
      max = parseInt( max );
      for ( var i = min; i < max; i++ ) {
        input.push( i );
      }

      return input;
    };
  } ] );

} )( angular );
