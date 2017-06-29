( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnPartial', [ '$timeout', 'gsnStore', 'gsnApi', function ( $timeout, gsnStore, gsnApi ) {
    // Usage:   bind rss feed to some property
    //
    // Creates: 2014-01-06
    //
    var directive = {
      link: link,
      restrict: 'EA',
      scope: true,
    };
    return directive;

    function link( scope, element, attrs ) {
      scope.version = attrs.version || '1';
      scope.activate = activate;
      scope.notFound = false;
      scope.hasScript = false;
      scope.partialContents = [];
      scope.firstContent = {};
      scope.searchContentName = gsnApi.isNull( attrs.gsnPartial.replace( /^\/+/gi, '' ), '' ).replace( /[\-]/gi, ' ' );
      scope.contentName = angular.lowercase( scope.searchContentName );

      function activate() {
        var contentName = scope.contentName;

        // attempt to retrieve static content remotely
        if ( scope.version === '2' ) {
          gsnStore.getPartial( contentName ).then( function ( rst ) {
            if ( rst.success ) {
              processData2( rst.response );
            } else {
              scope.notFound = true;
            }
          } );
        } else {
          gsnStore.getStaticContent( contentName ).then( function ( rst ) {
            if ( rst.success ) {
              processData( rst.response );
            } else {
              scope.notFound = true;
            }
          } );
        }
      }

      scope.activate();

      //#region Internal Methods

      function processData2( data ) {
        if ( data ) {
          processData( data.Contents || [] );
        }
      }

      function processData( data ) {
        var hasScript = false;
        var result = [];
        if ( !angular.isArray( data ) || gsnApi.isNull( data, [] ).length <= 0 ) {
          scope.notFound = true;
          return;
        }

        // make sure we sort the static content correctly
        gsnApi.sortOn( data, 'SortBy' );

        // detect for script in all contents so we can render inside of iframe
        for ( var i = 0; i < data.length; i++ ) {
          var item = data[ i ];
          if ( item.IsMetaData ) continue;
          result.push( item );

          if ( !hasScript && item.Description ) {
            // find scripts
            hasScript = /<\/script>/gi.test( item.Description + '' );
          }
        }

        scope.hasScript = hasScript;

        // make first element
        if ( data.length >= 1 ) {
          scope.firstContent = result[ 0 ];
        }

        scope.partialContents = result;
      }
      //#endregion
    }
  } ] );
} )( angular );
