( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.filter( 'tel', function () {
    // Usage: phone number formating phoneNumber | tel
    //
    return function ( tel, format, regex ) {
      if ( !tel ) return '';

      regex = regex ? new RegExp( regex ) : /(\d{3})(\d{3})(\d{4})/;
      var value = ( '' + tel ).replace( /\D/g, '' );

      return value.replace( regex, format || '$1-$2-$3' );
    };
  } );

} )( angular );
