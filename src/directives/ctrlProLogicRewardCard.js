( function ( angular, undefined ) {
  'use strict';

  // Module this belongs.
  var myDirectiveName = 'ctrlProLogicRewardCard';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnProfile', 'gsnApi', 'gsnStore', 'gsnProLogicRewardCard', '$timeout', '$http', '$filter', myController ] )
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
  // ProLogic Reward Card
  ////
  function myController( $scope, gsnProfile, gsnApi, gsnStore, gsnProLogicRewardCard, $timeout, $http, $filter ) {
    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server
    $scope.profile = null;
    $scope.loyaltyCard = null;
    $scope.primaryLoyaltyAddress = null; // Store the primary address for later use.
    $scope.stores = null;
    $scope.states = null;
    $scope.validLoyaltyCard = {
      isValidLoyaltyCard: false,
      ExternalId: 0,
      rewardCardUpdated: 0
    };

    // Remember, you can not watch a boolean value in angularjs!!
    $scope.datePickerOptions = {
      formatYear: 'yy',
      startingDay: 1,
      datePickerOpen: false
    };
    $scope.dateFormats = [ 'MMMM-dd-yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate' ];
    $scope.dateFormat = $scope.dateFormats[ 0 ];
    $scope.TodaysDate = new Date();
    $scope.datePickerMinDate = new Date( 1900, 1, 1 );
    $scope.datePickerMaxDate = new Date( 2025, 12, 31 );

    function processCardInfo( loyalityCard, isValid ) {
      $scope.loyaltyCard = loyalityCard;
      $scope.validLoyaltyCard.isValidLoyaltyCard = isValid;
      if ( $scope.validLoyaltyCard.isValidLoyaltyCard ) {
        // Get the primary address.
        getPrimaryAddress( $scope.loyaltyCard.Household );

        // Create a dictionary for the promotion variables.
        $scope.loyaltyCard.Household.PromotionVariables.pvf = gsnApi.mapObject( $scope.loyaltyCard.Household.PromotionVariables.PromotionVariable, 'Name' );
      }
    }

    ////
    /// Load Loyalty Card Profile
    ////
    $scope.loadLoyaltyCardData = function () {

      // Get the profile, this should be cached.
      gsnProfile.getProfile().then( function ( p ) {

        if ( $scope.validLoyaltyCard ) {
          $scope.validLoyaltyCard.isValidLoyaltyCard = false;
        }

        // Do we have a profile? We must in order to proceed.
        if ( p.success ) {

          // Get the states.
          gsnStore.getStates().then( function ( rsp ) {
            $scope.states = rsp.response;
          } );

          // Make a copy
          $scope.profile = gsnApi.isNull( angular.copy( p.response ), {} );
          if ( ( $scope.profile !== null ) && ( gsnApi.isNull( $scope.profile.ExternalId, null ) !== null ) ) {

            // Get the stores for the card.
            gsnStore.getStores().then( function ( rsp ) {
              $scope.stores = rsp.response;
            } );

            // Initialize the external id.
            $scope.validLoyaltyCard.ExternalId = $scope.profile.ExternalId;

            // The external id must have a length greater than two.
            if ( $scope.validLoyaltyCard.ExternalId.length > 2 ) {

              gsnProLogicRewardCard.getLoyaltyCard( $scope.profile, processCardInfo );
            } else {

              // Set the invalid flag.
              $scope.validLoyaltyCard.isValidLoyaltyCard = false;

              // Set the data null.
              $scope.loyaltyCard = null;
            }
          }
        }
      } );
    };

    ////
    // Is Valid Club Store
    ////
    $scope.isValidClubStore = function ( listOfStores ) {

      // Default to true.
      var returnValue = false;

      // Make sure that its not null.
      if ( gsnApi.isNull( $scope.profile, null ) !== null ) {

        // If the store listed is the current store, then return true.
        for ( var index = 0; index < listOfStores.length; index++ ) {

          // If the store number matches, then apply this flag.
          if ( $scope.profile.PrimaryStoreId === listOfStores[ index ] ) {

            returnValue = true;
            break;
          }
        }
      }

      // Return the value.
      return returnValue;
    };

    ////
    // Update Reward Card
    ////
    $scope.updateRewardCard = function () {

      var handleResponse = function ( rsp ) {

        // Mark the reward card as updated.
        $scope.validLoyaltyCard.rewardCardUpdated++;

        // Reload the loyalty card data.
        $scope.loadLoyaltyCardData();
      };
      $scope.loyaltyCard.Member.DateOfBirth = $filter( 'date' )( $scope.loyaltyCard.Member.DateOfBirth, 'yyyy-MM-dd' );
      var household = $scope.loyaltyCard.Household;
      var address = household.Addresses.Address;
      household.Addresses = {};
      household.Addresses.Address = [];
      household.Addresses.Address.push( address );
      household.PromotionVariables.PromotionVariable = [];
      var payload = {
        Household: household,
        Member: $scope.loyaltyCard.Member
      };

      var url = gsnApi.getStoreUrl().replace( /store/gi, 'ProLogic' ) + '/SaveCardMember/' + gsnApi.getChainId() + '?cardMemberData=' + JSON.stringify( $scope.loyaltyCard );
      $http.post( url, {}, {
        headers: gsnApi.getApiHeaders()
      } ).success( handleResponse ).error( handleResponse );
    };

    ////
    // get Club Total
    ////
    $scope.getClubTotal = function ( nameFieldList ) {

      var returnValue = 0;

      // Make sure that this is not null.
      if ( ( gsnApi.isNull( $scope.loyaltyCard, null ) !== null ) && ( gsnApi.isNull( $scope.loyaltyCard.Household, null ) !== null ) && ( gsnApi.isNull( $scope.loyaltyCard.Household.PromotionVariables, null ) !== null ) && ( $scope.loyaltyCard.Household.PromotionVariables.recordCount > 0 ) ) {

        // Loop through the data to get the
        for ( var index = 0; index < nameFieldList.length; index++ ) {

          // Get the promotion variable item.
          var promotionVariableItem = $scope.loyaltyCard.Household.PromotionVariables.pvf[ nameFieldList[ index ] ];
          if ( gsnApi.isNull( promotionVariableItem, null ) !== null ) {
            returnValue = returnValue + Number( promotionVariableItem.Value );
          }
        }
      }

      return returnValue;
    };

    ////
    // get Club Value
    ////
    $scope.getClubValue = function ( nameField, isCurrency ) {

      var returnValue = '0';

      // Make sure that this is not null.
      if ( ( gsnApi.isNull( $scope.loyaltyCard, null ) !== null ) && ( gsnApi.isNull( $scope.loyaltyCard.Household, null ) !== null ) && ( gsnApi.isNull( $scope.loyaltyCard.Household.PromotionVariables, null ) !== null ) && ( $scope.loyaltyCard.Household.PromotionVariables.recordCount > 0 ) ) {

        // Get the promotion Variable Item.
        var promotionVariableItem = $scope.loyaltyCard.Household.PromotionVariables.pvf[ nameField ];
        if ( gsnApi.isNull( promotionVariableItem, null ) !== null ) {

          if ( isCurrency ) {
            returnValue = $filter( 'currency' )( ( promotionVariableItem.Value / 100 ), '$' );
          } else {
            returnValue = $filter( 'number' )( promotionVariableItem.Value, 2 );
          }
        }
      }

      // Replace the .00
      returnValue = returnValue.replace( '.00', '' );

      return returnValue;
    };

    ////
    // Open the date picker.
    ////
    $scope.openDatePicker = function ( $event ) {

      // Handle the events.
      $event.preventDefault();
      $event.stopPropagation();

      // Remember, you can not watch a boolean value in angularjs!!
      $scope.datePickerOptions.datePickerOpen = !$scope.datePickerOptions.datePickerOpen;
    };

    ////
    // Disabled Date Picker (if you want to disable certain days!) -- Not used here
    ////
    $scope.disabledDatePicker = function ( date, mode ) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    ////
    // Get Primary Address
    ////
    function getPrimaryAddress( householdField ) {
      if ( ( gsnApi.isNull( householdField, null ) !== null ) && ( gsnApi.isNull( householdField.Addresses, null ) !== null ) ) {
        // Assign the primary address
        var _address = null;
        //Initialize the primary address
        var _primaryaddress = {
          'City': undefined,
          'CountryCode': undefined,
          'PostalCode': undefined,
          'Province': undefined,
          'StreetAddress': undefined,
          'StreetAddress2': undefined
        };
        //Assign the address in temp value
        _address = householdField.Addresses.Address.length === undefined ? householdField.Addresses.Address : householdField.Addresses.Address[ 0 ];
        if ( _address !== null ) {
          //Bind the value from address to primary address object to retain the streetaddress2 property
          for ( var key in _address ) {
            if ( _primaryaddress.hasOwnProperty( key ) ) {
              _primaryaddress[ key ] = _address[ key ];
            }
          }
          //Check and Split the street address and assign to respective property
          if ( _address.StreetAddress !== '' && _address.StreetAddress.includes( '\n' ) ) {
            _primaryaddress.StreetAddress = _address.StreetAddress.split( '\n' )[ 0 ].trim();
            _primaryaddress.StreetAddress2 = _address.StreetAddress.split( '\n' )[ 1 ].trim();
          }
          //Assign the value to scope variable
          $scope.primaryLoyaltyAddress = _primaryaddress;
        }
      }
    }

    ////
    // Get Promotion Value
    ////
    $scope.GetPromotionValue = function ( name, value ) {
      var promotionValue = value;

      // If there is a tracker in the name, then we have a dollar value.
      if ( name.indexOf( 'tracker', 0 ) > 0 ) {
        promotionValue = $filter( 'currency' )( value, '$' );
      } else {
        promotionValue = $filter( 'number' )( value, 2 );
      }

      return promotionValue;
    };

    ////
    /// Activate
    ////
    $scope.activate = function activate() {

      // Load the loyalty card profile first thing. Without this we really can't go very far.
      $scope.loadLoyaltyCardData();
    };

    ////
    // Handle the event
    ////
    $scope.$on( 'gsnevent:updateprofile-successful', function ( evt, result ) {
      // Reload the data
      $scope.loadLoyaltyCardData();
    } );

    // Call the activate method.
    $scope.activate();
  }
} )( angular );
