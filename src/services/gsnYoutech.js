( function ( angular, undefined ) {
  'use strict';
  var serviceId = 'gsnYoutech';
  angular.module( 'gsn.core' ).service( serviceId, [ '$rootScope', 'gsnApi', 'gsnProfile', 'gsnStore', '$q', '$http', gsnYoutech ] );

  function gsnYoutech( $rootScope, gsnApi, gsnProfile, gsnStore, $q, $http ) {
    // Usage: Youtech coupon integration service
    //        Written here as an example of future integration
    //
    // Summary:
    //    - When youtech api url exists, make call to get and cache total savings
    //    - When profile change occurred, make call to get any available coupon for card
    //
    // Creates: 2013-12-28 TomN
    //
    var service = {
      isValidCoupon: isValidCoupon,
      hasValidCard: hasValidCard,
      addCouponTocard: addCouponToCard,
      removeCouponFromCard: removeCouponFromCard,
      isAvailable: isAvailable,
      isOnCard: isOnCard,
      hasRedeemed: hasRedeemed,
      hasCard: hasCard,
      enable: true
    };
    var $saveData = initData();
    $rootScope[ serviceId ] = service;
    $rootScope.$on( 'gsnevent:logout', function ( event, result ) {
      if ( !service.enable ) {
        return;
      }
      $saveData = initData();
    } );
    $rootScope.$on( 'gsnevent:profile-load-success', function ( event, result ) {
      if ( !service.enable ) {
        return;
      }
      initData();
      if ( $saveData.youtechCouponUrl.length > 2 ) {
        //    - When profile change occurred, make call to get any available coupon for card
        $saveData.currentProfile = result.response;
        loadCardCoupon();
      }
    } );
    $rootScope.$on( 'gsnevent:store-persisted', function ( event, result ) {
      if ( !service.enable ) {
        return;
      }
      initData();
      if ( $saveData.currentProfile && $saveData.youtechCouponUrl.length > 2 ) {
        loadCardCoupon();
      }
    } );
    return service;
    //#region Internal Methods
    function initData() {
      return {
        youtechCouponUrl: gsnApi.isNull( gsnApi.getYoutechCouponUrl(), '' ),
        cardCouponResponse: null,
        availableCouponById: {},
        takenCouponById: {},
        redeemedCouponById: {},
        isValidResponse: false,
        currentProfile: {}
      };
    }

    function hasCard() {
      return ( gsnApi.isNull( $saveData.currentProfile.ExternalId, '' ).length > 0 );
    }

    function hasValidCard() {
      return hasCard() && $saveData.isValidResponse;
    }

    function isValidCoupon( couponId ) {
      var isValid = ( isAvailable( couponId ) || isOnCard( couponId ) );
      return isValid;
    }

    function isAvailable( couponId ) {
      return ( gsnApi.isNull( $saveData.availableCouponById[ couponId ], null ) !== null );
    }

    function isOnCard( couponId ) {
      return ( gsnApi.isNull( $saveData.takenCouponById[ couponId ], null ) !== null );
    }

    function hasRedeemed( couponId ) {
      return ( gsnApi.isNull( $saveData.redeemedCouponById[ couponId ], null ) !== null );
    }

    function handleFailureEvent( eventName, deferred, couponId, response ) {
      deferred.resolve( {
        success: false,
        response: response
      } );
      $rootScope.$broadcast( eventName, couponId );
    }

    function addCouponToCard( couponId ) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then( function () {
        var url = $saveData.youtechCouponUrl + '/AddToCard/' + gsnApi.getProfileId() + '/' + couponId;
        $http.post( url, {}, {
          headers: gsnApi.getApiHeaders()
        } ).success( function ( response ) {
          if ( response.Success ) {
            $saveData.takenCouponById[ couponId ] = true;
            $saveData.availableCouponById[ couponId ] = null;
            deferred.resolve( {
              success: response.Success,
              response: response
            } );
            $rootScope.$broadcast( 'gsnevent:youtech-cardcoupon-added', couponId );
          } else {
            handleFailureEvent( 'gsnevent:youtech-cardcoupon-addedfail', deferred, couponId, response.Message );
          }
        } ).error( function ( response ) {
          handleFailureEvent( 'gsnevent:youtech-cardcoupon-addfail', deferred, couponId, response );
        } );
      } );
      return deferred.promise;
    }

    function removeCouponFromCard( couponId ) {
      var deferred = $q.defer();
      gsnApi.getAccessToken().then( function () {
        var url = $saveData.youtechCouponUrl + '/RemoveFromCard/' + gsnApi.getProfileId() + '/' + couponId;
        $http.post( url, {}, {
          headers: gsnApi.getApiHeaders()
        } ).success( function ( response ) {
          if ( response.Success ) {
            $saveData.availableCouponById[ couponId ] = true;
            $saveData.takenCouponById[ couponId ] = null;
            deferred.resolve( {
              success: response.Success,
              response: response
            } );
            $rootScope.$broadcast( 'gsnevent:youtech-cardcoupon-removed', couponId );
          } else {
            handleFailureEvent( 'gsnevent:youtech-cardcoupon-removefail', deferred, couponId, response.Message );
          }
        } ).error( function ( response ) {
          handleFailureEvent( 'gsnevent:youtech-cardcoupon-removefail', deferred, couponId, response );
        } );
      } );
      return deferred.promise;
    }

    function loadCardCoupon() {
      gsnApi.getAccessToken().then( function () {
        var url = $saveData.youtechCouponUrl + '/GetProfileCoupons/' + gsnApi.getProfileId();
        $http.get( url, {
          headers: gsnApi.getApiHeaders()
        } ).success( function ( response ) {
          // process card coupon response
          if ( response.Success ) {
            var i = 0;
            $saveData.isValidResponse = true;
            try {
              $saveData.cardCouponResponse = response.Response;
              if ( $saveData.cardCouponResponse.availableCoupons ) {
                $saveData.availableCouponById = gsnApi.mapObject( $saveData.cardCouponResponse.availableCoupons.coupon, 'couponId' );
              }
              if ( $saveData.cardCouponResponse.available_ids ) {
                $saveData.availableCouponById = {};
                for ( i = 0; i < $saveData.cardCouponResponse.available_ids.length; i++ ) {
                  $saveData.availableCouponById[ $saveData.cardCouponResponse.available_ids[ i ] ] = true;
                }
              }
              if ( $saveData.cardCouponResponse.takenCoupons ) {
                $saveData.takenCouponById = gsnApi.mapObject( $saveData.cardCouponResponse.takenCoupons.coupon, 'couponId' );
              }
              var toParse = gsnApi.isNull( $saveData.cardCouponResponse.taken_ids, $saveData.cardCouponResponse.clipped_active_ids );
              if ( toParse ) {
                $saveData.takenCouponById = {};
                for ( i = 0; i < toParse.length; i++ ) {
                  $saveData.takenCouponById[ toParse[ i ] ] = true;
                }
              }
              // add clipped_redeemed_ids
              toParse = $saveData.cardCouponResponse.clipped_redeemed_ids;
              if ( toParse ) {
                $saveData.redeemedCouponById = {};
                for ( i = 0; i < toParse.length; i++ ) {
                  $saveData.takenCouponById[ toParse[ i ] ] = true;
                  $saveData.redeemedCouponById[ toParse[ i ] ] = true;
                }
              }
            } catch ( e ) {}
            $rootScope.$broadcast( 'gsnevent:youtech-cardcoupon-loaded', service );
            return;
          }
          $saveData = initData();
          $rootScope.$broadcast( 'gsnevent:youtech-cardcoupon-loadfail', service );
        } ).error( function ( response ) {
          $saveData.isValidResponse = false;
          $rootScope.$broadcast( 'gsnevent:youtech-cardcoupon-loadfail', service );
        } );
      } );
    }
    //#endregion
  }
} )( angular );
