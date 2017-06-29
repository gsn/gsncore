// bridging between Digital Store, ExpressLane, and Advertisment
( function ( angular, undefined ) {
  'use strict';
  var serviceId = 'gsnAdvertising';
  angular.module( 'gsn.core' ).service( serviceId, [ '$timeout', '$location', 'gsnProfile', 'gsnApi', '$window', gsnAdvertising ] );

  function gsnAdvertising( $timeout, $location, gsnProfile, gsnApi, $window ) {
    var returnObj = {};
    var bricktag = $window.bricktag;

    if ( !bricktag )
      return returnObj;

    bricktag.on( 'clickRecipe', function ( data ) {
      $timeout( function () {
        $location.url( '/recipe/' + data.detail.RecipeId );
      } );
    } );

    bricktag.on( 'clickProduct', function ( data ) {
      $timeout( function () {
        var product = data.detail;
        if ( product ) {
          var item = {
            Quantity: gsnApi.isNaN( parseInt( product.Quantity ), 1 ),
            ItemTypeId: 7,
            Description: gsnApi.isNull( product.Description, '' ).replace( /^\s+/gi, '' ),
            CategoryId: product.CategoryId,
            BrandName: product.BrandName,
            AdCode: product.AdCode
          };

          gsnProfile.addItem( item );
        }
      } );
    } );

    bricktag.on( 'clickLink', function ( data ) {
      $timeout( function () {
        var linkData = data.detail;
        if ( linkData ) {
          var url = gsnApi.isNull( linkData.Url, '' );
          var target = gsnApi.isNull( linkData.Target, '' );
          if ( target === '_blank' ) {
            // this is a link out to open in new window
            // $window.open(url, '');
            // commented out because it is not possible to open with interaction
            // it must be done on the ads itself
          } else {
            // assume this is an internal redirect
            if ( url.indexOf( '/' ) < 0 ) {
              url = '/' + url;
            }

            $location.url( url );
          }
        }
      } );
    } );

    return returnObj;
  }
} )( angular );
