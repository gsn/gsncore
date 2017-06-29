( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlMealPlanner';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnApi', 'gsnStore', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnApi, gsnStore ) {
    $scope.activate = activate;
    $scope.vm = {
      mealPlanners: []
    };

    function activate() {
      gsnStore.getMealPlannerRecipes().then( function ( rst ) {
        if ( rst.success ) {
          $scope.vm.mealPlanners = gsnApi.groupBy( rst.response, 'DisplayOrderDate' );
        }
      } );
    }

    $scope.activate();
    //#region Internal Methods

    //#endregion
  }

} )( angular );
