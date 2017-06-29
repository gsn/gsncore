( function ( angular, undefined ) {
  'use strict';
  var serviceId = 'gsnProLogicRewardCard';
  angular.module( 'gsn.core' ).service( serviceId, [ 'gsnApi', '$http', '$rootScope', '$timeout', gsnProLogicRewardCard ] );

  function gsnProLogicRewardCard( gsnApi, $http, $rootScope, $timeout ) {

    var returnObj = {};

    returnObj.rewardCard = null;
    returnObj.isValid = false;

    returnObj.getLoyaltyCard = function ( profile, callback ) {
      if ( returnObj.rewardCard ) {
        $timeout( function () {
          callback( returnObj.rewardCard, returnObj.isValid );
        }, 500 );
      } else if ( ( profile.ExternalId || '' ).length < 2 ) {
        callback( null, false );
      } else {
        var url = gsnApi.getStoreUrl().replace( /store/gi, 'ProLogic' ) + '/GetCardMember/' + gsnApi.getChainId() + '/' + profile.ExternalId;
        $http.get( url ).success( function ( response ) {
          returnObj.rewardCard = response.Response;
          if ( gsnApi.isNull( returnObj.rewardCard, null ) !== null ) {
            var gsnLastName = profile.LastName.toUpperCase().replace( /\s+/gi, '' );
            var proLogicLastName = returnObj.rewardCard.Member.LastName.toUpperCase().replace( /\s+/gi, '' );

            // The names can differ, but the names must be in the
            if ( ( gsnLastName === proLogicLastName ) || ( proLogicLastName.indexOf( gsnLastName ) >= 0 ) || ( gsnLastName.indexOf( proLogicLastName ) >= 0 ) ) {
              returnObj.isValid = true;
            }
          } else {
            returnObj.rewardCard = null;
          }
          callback( returnObj.rewardCard, returnObj.isValid );
        } );
      }
    };

    $rootScope.$on( 'gsnevent:logout', function () {
      returnObj.rewardCard = null;
      returnObj.isValid = false;
    } );

    return returnObj;
  }
} )( angular );
