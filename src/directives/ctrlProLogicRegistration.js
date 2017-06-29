( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlProLogicRegistration';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnProfile', 'gsnApi', '$timeout', 'gsnStore', '$interpolate', '$http', '$rootScope', myController ] )
    .directive( myDirectiveName, myDirective );

  ////
  // Directive
  ////
  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  ////
  // ProLogic Registration Controller.
  ////
  function myController( $scope, gsnProfile, gsnApi, $timeout, gsnStore, $interpolate, $http, $rootScope ) {
    $scope.activate = activate;
    $scope.totalSavings = '';
    $scope.profile = {
      PrimaryStoreId: gsnApi.getSelectedStoreId(),
      ReceiveEmail: true
    };

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server
    $scope.isFacebook = $scope.currentPath === '/registration/facebook';
    var template;

    $http.get( $scope.getThemeUrl( $scope.isFacebook ? '/views/email/registration-facebook.html' : '/views/email/registration.html' ) )
      .success( function ( response ) {
        template = response.replace( /data-ctrl-email-preview/gi, '' );
      } );

    ////
    // activate
    ////
    function activate() {
      if ( $scope.isFacebook ) {
        if ( gsnApi.isNull( $scope.facebookData.accessToken, '' ).length < 1 ) {
          $scope.goUrl( '/' );
          return;
        }

        var user = $scope.facebookData.user;
        $scope.profile.Email = user.email;
        $scope.profile.FirstName = user.first_name;
        $scope.profile.LastName = user.last_name;
      }

      gsnStore.getManufacturerCouponTotalSavings().then( function ( rst ) {
        if ( rst.success ) {
          $scope.totalSavings = gsnApi.isNaN( parseFloat( rst.response ), 0.00 ).toFixed( 2 );
        }
      } );

      gsnStore.getStores().then( function ( rsp ) {
        $scope.stores = rsp.response;
      } );

    }

    ////
    // register Profile
    ////
    $scope.registerProfile = function () {
      var payload = angular.copy( $scope.profile );
      if ( $scope.myForm.$valid ) {

        // prevent double submit
        if ( $scope.isSubmitting ) return;

        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;

        // setup email registration stuff
        if ( $scope.isFacebook ) {
          payload.FacebookToken = $scope.facebookData.accessToken;
        }

        payload.ChainName = gsnApi.getChainName();
        payload.FromEmail = gsnApi.getRegistrationFromEmailAddress();
        payload.emailLogo = gsnApi.getRegistrationEmailLogo();
        payload.ManufacturerCouponTotalSavings = '$' + $scope.totalSavings;
        payload.CopyrightYear = ( new Date() ).getFullYear();
        payload.UserName = gsnApi.isNull( payload.UserName, payload.Email );
        payload.WelcomeSubject = 'Welcome to ' + payload.ChainName + ' online.';

        $scope.email = payload;
        payload.WelcomeMessage = $interpolate( template.replace( /(data-ng-src)+/gi, 'src' ).replace( /(data-ng-href)+/gi, 'href' ) )( $scope );
        gsnProfile.registerProfile( payload )
          .then( function ( result ) {
            $scope.isSubmitting = false;
            $scope.isValidSubmit = result.success;
            if ( result.success ) {
              $scope.isSubmitting = true;

              $rootScope.$broadcast( 'gsnevent:registration-successful', result );

              // since we have the password, automatically login the user
              if ( $scope.isFacebook ) {
                gsnProfile.loginFacebook( result.response.UserName, payload.FacebookToken );
              } else {
                gsnProfile.login( result.response.UserName, payload.Password );
              }

            }
          } );
      }
    };

    ////
    // We need to navigate no matter what.
    ////
    $scope.$on( 'gsnevent:login-success', function ( evt, result ) {

      // Mark the submitting flag.
      $scope.isSubmitting = false;
    } );

    ////
    //
    ////
    $scope.$on( 'gsnevent:login-failed', function ( evt, result ) {} );

    $scope.activate();
  }
} )( angular );
