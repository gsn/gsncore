( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.filter( 'truncate', [ function () {
    /**
     * {{some_text | truncate:true:100:' ...'}}
     * @param  {string}  value    the original text
     * @param  {boolean} wordwise true to split by word
     * @param  {integer} max      max character or word
     * @param  {string}  tail     ending characters
     * @return {string}
     */
    return function ( value, wordwise, max, tail ) {
      if ( !value ) return '';

      max = parseInt( max, 10 );
      if ( !max ) return value;
      if ( value.length <= max ) return value;

      value = value.substr( 0, max );
      if ( wordwise ) {
        var lastspace = value.lastIndexOf( ' ' );
        if ( lastspace !== -1 ) {
          value = value.substr( 0, lastspace );
        }
      }

      return value + ( tail || ' …' );
    };
  } ] );

} )( angular );
