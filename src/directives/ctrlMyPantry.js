( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlMyPantry';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnProfile', 'gsnApi', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnProfile, gsnApi ) {
    $scope.activate = activate;
    $scope.vm = {
      products: [],
      productsByCategory: [],
      hasAllItems: true
    };

    function activate() {
      gsnProfile.getMyPantry2().then( function ( result ) {
        if ( result.success ) {
          $scope.vm.products = result.response;
          $scope.vm.productsByCategory = gsnApi.groupBy( result.response, 'DepartmentName' );
        }
      } );
    }


    $scope.selectFilter = function ( filterGroup, filterItem ) {
      var hasAllItems = true;
      angular.forEach( filterGroup, function ( item ) {
        if ( item.selected ) {
          hasAllItems = false;
        }
      } );

      $scope.vm.hasAllItems = hasAllItems;
    };

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }

} )( angular );
