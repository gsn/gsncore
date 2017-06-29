( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlEmailPreview';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnStore', 'gsnApi', 'gsnProfile', '$location', myController ] )
    .directive( myDirectiveName, myDirective );

  // directive for previewing email
  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnStore, gsnApi, gsnProfile, $location ) {
    $scope.activate = activate;
    $scope.email = {};
    $scope.totalSavings = '';

    function activate() {
      gsnStore.getManufacturerCouponTotalSavings().then( function ( rst ) {
        if ( rst.success ) {
          $scope.totalSavings = gsnApi.isNaN( parseFloat( rst.response ), 0.00 ).toFixed( 2 );
          $scope.email.ManufacturerCouponTotalSavings = '$' + $scope.totalSavings;
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
          angular.copy( $location.search(), email );
        }
      } );
    }

    $scope.activate();
  }
} )( angular );
