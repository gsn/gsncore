( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlContactUs';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnProfile', 'gsnApi', '$timeout', 'gsnStore', '$interpolate', '$http', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnProfile, gsnApi, $timeout, gsnStore, $interpolate, $http ) {

    $scope.activate = activate;
    $scope.vm = {
      PrimaryStoreId: gsnApi.getSelectedStoreId()
    };
    $scope.masterVm = {
      PrimaryStoreId: gsnApi.getSelectedStoreId()
    };

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server
    $scope.errorResponse = null;
    $scope.contactSuccess = false;
    $scope.topics = [];
    $scope.topicsByValue = {};
    $scope.storeList = [];
    $scope.captcha = {};
    $scope.storesById = {};

    var template;

    $http.get( $scope.getThemeUrl( '/views/email/contact-us.html' ) )
      .success( function ( response ) {
        template = response.replace( /data-ctrl-email-preview/gi, '' );
      } );

    function activate() {
      gsnStore.getStores().then( function ( rsp ) {
        $scope.stores = rsp.response;

        // make sure that it is order by state, then by name
        $scope.storesById = gsnApi.mapObject( $scope.stores, 'StoreId' );
      } );

      gsnProfile.getProfile().then( function ( p ) {
        if ( p.success ) {
          $scope.masterVm = angular.copy( p.response );
          $scope.doReset();
        }
      } );

      $scope.topics = gsnApi.groupBy( getData(), 'ParentOption' );
      $scope.topicsByValue = gsnApi.mapObject( $scope.topics, 'key' );
      $scope.parentTopics = $scope.topicsByValue[ '' ];

      $scope.topicsByValue = gsnApi.del( $scope.topicsByValue[ '' ] );
    }

    $scope.getSubTopics = function () {
      return $scope.topicsByValue[ $scope.vm.Topic ];
    };

    $scope.getFullStateName = function ( store ) {
      return '=========' + store.LinkState.FullName + '=========';
    };

    $scope.getStoreDisplayName = function ( store ) {
      return store.StoreName + ' - ' + store.PrimaryAddress;
    };

    $scope.doSubmit = function () {
      var payload = $scope.vm;
      if ( $scope.myContactUsForm.$valid ) {
        if ( !$scope.hasReceiveEmail ) {
          gsnApi.del( payload, 'ReceiveEmail' );
        }

        payload.CaptchaChallenge = $scope.captcha.challenge;
        payload.CaptchaResponse = $scope.captcha.response;
        payload.Store = $scope.getStoreDisplayName( $scope.storesById[ payload.PrimaryStoreId ] );
        $scope.email = payload;
        payload.EmailMessage = $interpolate( template )( $scope );
        // prevent double submit
        if ( $scope.isSubmitting ) return;

        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        $scope.errorResponse = null;
        gsnProfile.sendContactUs( payload )
          .then( function ( result ) {
            $scope.isSubmitting = false;
            $scope.isValidSubmit = result.success;
            if ( result.success ) {
              $scope.contactSuccess = true;
            } else if ( typeof ( result.response ) === 'string' ) {
              $scope.errorResponse = result.response;
            } else {
              $scope.errorResponse = gsnApi.getServiceUnavailableMessage();
            }
          } );
      }
    };

    $scope.doReset = function () {
      $scope.vm = angular.copy( $scope.masterVm );
      $scope.vm.ConfirmEmail = $scope.vm.Email;
    };

    $scope.activate();

    function getData() {
      return [
        {
          'Value': 'Company',
          'Text': 'Company',
          'ParentOption': ''
          },
        {
          'Value': 'Store',
          'Text': 'Store (specify store below)',
          'ParentOption': ''
          },
        {
          'Value': 'Other',
          'Text': 'Other (specify below)',
          'ParentOption': ''
          },
        {
          'Value': 'Employment',
          'Text': 'Employment',
          'ParentOption': ''
          },
        {
          'Value': 'Website',
          'Text': 'Website',
          'ParentOption': ''
          }
      ];
    }
  }
} )( angular );
