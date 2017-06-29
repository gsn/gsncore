( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnWatch', [ function () {
    // Usage: add monitoring capability
    //
    // Creates: 2013-12-12 TomN
    //
    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };
    return directive;

    function link( scope, element, attrs ) {
      var modelVal = attrs.model;
      if ( typeof ( modelVal ) === 'undefined' ) {
        modelVal = '{}';
      }

      scope.model = scope.$eval( modelVal );
      var data = scope.$eval( attrs.gsnWatch );
      angular.forEach( data, function ( item, key ) {
        scope.$watch( item, function ( newValue ) {
          scope.model[ key ] = newValue;
        } );
      } );
    }
  } ] );

} )( angular );
