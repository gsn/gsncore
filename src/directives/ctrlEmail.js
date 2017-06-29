( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlEmail';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnStore', 'gsnApi', 'gsnProfile', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnStore, gsnApi, gsnProfile ) {
    $scope.activate = activate;
    $scope.emailShoppingList = doEmailShoppingList;
    $scope.email = {};
    $scope.vm = {
      Message: ''
    };
    $scope.totalSavings = '';

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server

    function activate() {
      gsnStore.getManufacturerCouponTotalSavings().then( function ( rst ) {
        if ( rst.success ) {
          $scope.totalSavings = gsnApi.isNaN( parseFloat( rst.response ), 0.00 ).toFixed( 2 );
        }
      } );

      gsnProfile.getProfile().then( function ( p ) {
        if ( p.success ) {
          var profile = gsnApi.isNull( angular.copy( p.response ), {} );

          var email = $scope.email;
          email.FirstName = profile.FirstName;
          email.ChainName = gsnApi.getChainName();
          email.CopyrightYear = ( new Date() ).getFullYear();
          email.ManufacturerCouponTotalSavings = '$' + $scope.totalSavings;
          email.FromEmail = gsnApi.getRegistrationFromEmailAddress();

          $scope.vm = angular.copy( email, $scope.vm );
          $scope.vm.Message = '';
          $scope.vm.Name = ( gsnApi.isNull( profile.FirstName, '' ) + ' ' + gsnApi.isNull( profile.LastName, '' ) ).replace( /^\s+/gi, '' );
          $scope.vm.EmailFrom = gsnApi.isNull( profile.Email, '' );
        }
      } );
    }

    $scope.activate();

    //#region Internal Methods
    function doEmailShoppingList() {
      /// <summary>submit handler for sending shopping list email</summary>

      var payload = angular.copy( $scope.vm );
      if ( $scope.myForm.$valid ) {
        $scope.hasSubmitted = true;
        payload.Message = 'You are receiving this message because ' + payload.EmailFrom + ' created a shopping list for you to see.<br/>' + payload.Message.replace( /\n+/gi, '<br/>' );
        gsnProfile.sendEmail( payload ).then( function ( rsp ) {
          $scope.isValidSubmit = rsp.success;
        } );
      }
    }
    //#endregion
  }

} )( angular );
