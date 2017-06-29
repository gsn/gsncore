( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlMySpecials';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnStore', 'gsnProfile', 'gsnApi', '$timeout', myController ] )
    .directive( myDirectiveName, myDirective );


  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnStore, gsnProfile, gsnApi, $timeout ) {
    $scope.activate = activate;
    $scope.vm = {
      specials: [],
      products: [],
      productsByCategory: []
    };

    function activate() {
      if ( gsnStore.hasCompleteCircular() ) {
        gsnProfile.getMyCircularItems().then( function ( result ) {
          if ( result.success ) {
            $scope.vm.specials = result.response;
          }
        } );

        gsnProfile.getMyProducts().then( function ( result ) {
          if ( result.success ) {
            $scope.vm.products = result.response;
            $scope.vm.productsByCategory = gsnApi.groupBy( result.response, 'DepartmentName' );
          }
        } );
      }
    }

    $scope.$on( 'gsnevent:circular-loaded', function ( event, data ) {
      if ( data.success ) {
        $timeout( activate, 500 );
      }
    } );

    $scope.activate();

    //#region Internal Methods
    //#endregion
  }

} )( angular );
