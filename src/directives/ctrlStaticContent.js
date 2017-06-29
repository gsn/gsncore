( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlStaticContent';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnApi', 'gsnStore', '$timeout', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnApi, gsnStore, $timeout ) {
    $scope.activate = activate;
    $scope.notFound = false;
    $scope.hasScript = false;
    $scope.staticContents = [];
    $scope.firstContent = {};
    $scope.searchContentName = gsnApi.isNull( $scope.currentPath.replace( /^\/+/gi, '' ), '' ).replace( /[\-]/gi, ' ' );
    $scope.contentName = angular.lowercase( $scope.searchContentName );
    $scope.rst = null;

    function activate() {
      var contentName = $scope.contentName;
      if ( contentName.indexOf( '.aspx' ) > 0 ) {
        // do nothing for aspx page
        return;
      }
      if ( $scope.rst ) {
        return;
      }

      // attempt to retrieve static content remotely
      gsnStore.getStaticContent( contentName ).then( function ( rst ) {
        $scope.rst = rst;
        if ( rst.success ) {
          processData( rst.response );
        }
      } );
    }

    $scope.$on( 'gsnevent:circular-loaded', function ( event, data ) {
      if ( data.success ) {

        $timeout( activate, 500 );

        $scope.noCircular = false;
      } else {
        $scope.noCircular = true;
      }
    } );

    $scope.activate();

    //#region Internal Methods
    function processData( data ) {

      var hasScript = false;
      if ( !angular.isArray( data ) || gsnApi.isNull( data ).length <= 0 ) {
        $scope.notFound = true;
        return;
      }

      // make sure we sort the static content correctly
      gsnApi.sortOn( data, 'SortBy' );

      // detect for script in all contents so we can render inside of iframe
      for ( var i = 0; i < data.length; i++ ) {
        // do not continue processing
        if ( hasScript ) break;

        var item = data[ i ];
        if ( item.Description ) {
          // find scripts
          hasScript = angular.element( '<div>' + item.Description + '</div>' ).find( 'script' ).length > 0;
        }
      }

      if ( hasScript && data.length === 1 ) {
        $scope.contentName = '$has-scripting$';
      }

      // make first element
      if ( data.length >= 1 ) {
        $scope.firstContent = data.shift();
      }

      $scope.staticContents = data;
    }
    //#endregion
  }

} )( angular );
