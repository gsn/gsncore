( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlShoppingList';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnApi', 'gsnProfile', '$timeout', '$rootScope', 'gsnStore', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnApi, gsnProfile, $timeout, $rootScope, gsnStore ) {
    $scope.activate = activate;
    $scope.listviewList = [];
    $scope.selectedShoppingListId = 0;
    $scope.hasInitializePrinter = false;
    $scope.circular = {
      Circulars: []
    };

    function activate() {
      if ( $scope.currentPath === '/savedlists' ) {
        // refresh list
        $scope.doInitializeForSavedLists();
      } else {
        $timeout( function () {
          if ( gsnProfile.getShoppingList() ) {
            $rootScope.$broadcast( 'gsnevent:shoppinglist-page-loaded', gsnProfile.getShoppingList() );
          }
        }, 500 );
      }

      $scope.circular = gsnStore.getCircularData();
    }

    $scope.doInitializeForSavedLists = function () {
      $scope.listviewList.length = 0;
      var lists = gsnApi.isNull( gsnProfile.getShoppingLists(), [] );
      if ( lists.length < 1 ) return;

      for ( var i = 0; i < lists.length; i++ ) {
        var list = lists[ i ];

        if ( list.getStatus() !== 2 ) continue;

        list.text = list.getTitle();
        $scope.listviewList.push( list );

        // set first list as selected list
        if ( $scope.selectedShoppingListId < 1 ) {
          $scope.selectedShoppingListId = list.ShoppingListId;
        }
      }

    };

    $scope.startNewList = function () {
      // Get the previous list
      var previousList = gsnProfile.getShoppingList();

      // Delete the list if there are no items.
      if ( gsnApi.isNull( previousList.allItems(), [] ).length <= 0 ) {

        // Delete the shopping List
        gsnProfile.deleteShoppingList( previousList );
      }

      // Create the new list
      gsnProfile.createNewShoppingList().then( function ( rsp ) {

        // Activate the object
        activate();

        // Per Request: signal that the list has been deleted.
        $scope.$broadcast( 'gsnevent:shopping-list-created' );
      } );
    };

    ////
    // delete Current List
    ////
    $scope.deleteCurrentList = function () {
      var previousList = gsnProfile.getShoppingList();
      gsnProfile.deleteShoppingList( previousList );
      gsnProfile.createNewShoppingList().then( function ( rsp ) {

        // Activate the object
        activate();

        // Per Request: signal that the list has been deleted.
        $scope.$broadcast( 'gsnevent:shopping-list-deleted' );
      } );
    };

    $scope.getSelectedShoppingListId = function () {
      return $scope.selectedShoppingListId;
    };


    ////
    // Can Delete List
    ////
    $scope.canDeleteList = function () {
      return ( ( $scope.selectedShoppingListId !== gsnProfile.getShoppingListId() ) && ( 0 !== gsnProfile.getShoppingListId() ) );
    };

    ////
    // set Selected Shopping List Id
    ////
    $scope.setSelectedShoppingListId = function ( id ) {

      // Store the new.
      $scope.selectedShoppingListId = id;

      $scope.$broadcast( 'gsnevent:savedlists-selected', {
        ShoppingListId: id
      } );
    };

    $scope.$on( 'gsnevent:shoppinglists-loaded', activate );
    $scope.$on( 'gsnevent:shoppinglists-deleted', activate );
    $scope.$on( 'gsnevent:shoppinglist-created', activate );
    $scope.$on( 'gsnevent:savedlists-deleted', function () {
      // select next list
      $scope.doInitializeForSavedLists();
      $scope.$broadcast( 'gsnevent:savedlists-selected', {
        ShoppingListId: $scope.selectedShoppingListId
      } );
    } );

    $scope.$on( 'gsnevent:shopping-list-saved', function () {
      gsnProfile.refreshShoppingLists();
    } );

    $scope.activate();
  }

} )( angular );
