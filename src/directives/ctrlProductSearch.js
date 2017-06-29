( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlProductSearch';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnApi', 'gsnStore', '$filter', '$timeout', '$q', '$location', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnApi, gsnStore, $filter, $timeout, $q, $location ) {
    $scope.activate = activate;
    $scope.categories = [];
    $scope.vm = {
      searchResult: {},
      hasAllItems: true
    };
    $scope.totalItems = 10;
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.isSubmitting = true;

    function activate() {
      gsnStore.searchProducts( $location.search().q ).then( function ( rst ) {
        $scope.isSubmitting = false;
        if ( rst.success ) {
          $scope.vm.searchResult = rst.response;
          $scope.vm.searchResult.NonSaleItemResultGrouping = gsnApi.groupBy( $scope.vm.searchResult.ProductResult, 'DepartmentName' );
          $scope.vm.searchResult.NonSaleItemResult = {
            items: $scope.vm.searchResult.ProductResult
          };

          $scope.totalItems = $scope.vm.searchResult.ProductResult.length;
        }
      } );
    }

    $scope.selectFilter = function ( filterGroup, filterItem ) {
      angular.forEach( filterGroup, function ( item ) {
        if ( item !== filterItem ) {
          item.selected = false;
        }
      } );

      if ( filterItem.selected ) {
        $scope.vm.searchResult.NonSaleItemResult = filterItem;
      } else {
        $scope.vm.searchResult.NonSaleItemResult = {
          items: $scope.vm.searchResult.ProductResult
        };
      }

      $scope.vm.hasAllItems = !filterItem.selected;
    };
    $scope.activate();

    //#region Internal Methods
    //#endregion
  }

} )( angular );
