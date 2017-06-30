// bridging between Digital Store, ExpressLane, and Advertisment
( function ( angular, undefined ) {
  'use strict';
  var serviceId = 'gsnAdvertising';
  angular.module( 'gsn.core' ).service( serviceId, [ '$timeout', '$location', 'gsnProfile', 'gsnApi', '$window', 'debounce', '$rootScope', 'gsnStore', gsnAdvertising ] );

  function gsnAdvertising( $timeout, $location, gsnProfile, gsnApi, $window, debounce, $rootScope, gsnStore ) {
    var service = {
      forceRefresh: true,
      actionParam: null,
      doRefresh: debounce( doRefresh, 500 )
    };
    var bricktag = $window.bricktag;

    if ( !bricktag ) return service;

    if ( gsnApi.getConfig().isPrerender ) return;

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

    function shoppingListItemChange( event, shoppingList, item ) {
      var currentListId = gsnApi.getShoppingListId();
      if ( shoppingList.ShoppingListId === currentListId ) {
        var cat = gsnStore.getCategories()[ item.CategoryId ];
        bricktag.addDept( cat.CategoryName );
        // service.actionParam = {evtname: event.name, dept: cat.CategoryName, pdesc: item.Description, pcode: item.Id, brand: item.BrandName};
        service.doRefresh();
      }
    }

    $rootScope.$on( 'gsnevent:shoppinglistitem-updating', shoppingListItemChange );
    $rootScope.$on( 'gsnevent:shoppinglistitem-removing', shoppingListItemChange );
    $rootScope.$on( 'gsnevent:shoppinglist-loaded', function ( event, shoppingList, item ) {
      var list = gsnProfile.getShoppingList();
      if ( list ) {
        // load all the ad depts
        var items = gsnProfile.getShoppingList().allItems();
        var categories = gsnStore.getCategories();

        angular.forEach( items, function ( item, idx ) {
          if ( gsnApi.isNull( item.CategoryId, null ) === null ) return;

          if ( categories[ item.CategoryId ] ) {
            var newKw = categories[ item.CategoryId ].CategoryName;
            bricktag.addDept( newKw );
          }
        } );

        // service.actionParam = {evtname: event.name, evtcategory: gsnProfile.getShoppingListId() };
      }
    } );

    $rootScope.$on( '$locationChangeSuccess', function ( event, next ) {
      var currentPath = angular.lowercase( gsnApi.isNull( $location.path(), '' ) );
      gsnProfile.getProfile().then( function ( p ) {
        var isLoggedIn = gsnApi.isLoggedIn();

        bricktag.setDefault( {
          page: currentPath,
          storeid: gsnApi.getSelectedStoreId(),
          consumerid: gsnProfile.getProfileId(),
          isanon: !isLoggedIn,
          loyaltyid: p.response.ExternalId
        } );
      } );
      service.forceRefresh = true;
      service.doRefresh();
    } );

    $rootScope.$on( 'gsnevent:loadads', function ( event, next ) {
      service.actionParam = {
        evtname: event.name
      };
      service.doRefresh();
    } );

    $rootScope.$on( 'gsnevent:digitalcircular-pagechanging', function ( event, data ) {
      // service.actionParam = {evtname: event.name, evtcategory: data.circularIndex, pdesc: data.pageIndex};
      service.doRefresh();
    } );

    init();

    // initialization
    function init() {
      if ( service.isIE ) {
        bricktag.minSecondBetweenRefresh = 15;
      }
    }

    // refresh method
    function doRefresh() {
      ( $rootScope.gvm || {} ).adsCollapsed = false;
      bricktag.refresh( service.actionParam, service.forceRefresh );
      service.forceRefresh = false;
    }

    return service;
  }
} )( angular );
