( function ( angular, undefined ) {
  'use strict';
  var serviceId = 'gsnStore';
  angular.module( 'gsn.core' ).service( serviceId, [ '$rootScope', '$http', 'gsnApi', '$q', '$timeout', '$location', gsnStore ] );

  function gsnStore( $rootScope, $http, gsnApi, $q, $timeout, $location ) {
    var returnObj = {};

    $rootScope[ serviceId ] = returnObj;
    gsnApi.gsn.$store = returnObj;

    // cache current user selection
    var _lc = {
      previousGetStore: null,
      manufacturerCoupons: {},
      instoreCoupons: {},
      youtechCoupons: {},
      quickSearchItems: {},
      topRecipes: {},
      faAskTheChef: {},
      faCookingTip: {},
      faArticle: {},
      faRecipe: {},
      faVideo: {},
      mealPlanners: {},
      manuCouponTotalSavings: {},
      states: {},
      adPods: {},
      specialAttributes: {},
      circular: null,
      allVideos: []
    };

    var betterStorage = {};

    // cache current processed circular data
    var _cp = {
      circularByTypeId: {},
      categoryById: {},
      itemsById: {},
      staticCircularById: {},
      storeCouponById: {},
      manuCouponById: {},
      youtechCouponById: {},
      processCompleted: 0, // process completed date
      lastProcessDate: 0 // number represent a date in month
    };

    var processingQueue = [];

    // get circular by type id
    returnObj.getCircular = function ( circularTypeId ) {
      var result = _cp.circularByTypeId[ circularTypeId ];
      return result;
    };

    // get all categories
    returnObj.getCategories = function () {
      return _cp.categoryById;
    };

    // get inventory categories
    returnObj.getInventoryCategories = function () {
      var url = gsnApi.getStoreUrl() + '/GetInventoryCategories/' + gsnApi.getChainId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http( {}, url );
    };

    // get sale item categories
    returnObj.getSaleItemCategories = function () {
      var url = gsnApi.getStoreUrl() + '/GetSaleItemCategories/' + gsnApi.getChainId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http( {}, url );
    };

    // refresh current store circular
    returnObj.refreshCircular = function () {
      if ( _lc.circularIsLoading ) return;
      var config = gsnApi.getConfig();
      if ( config.AllContent ) {
        _lc.circularIsLoading = true;
        processCircularData( function () {
          _lc.circularIsLoading = false;
        } );
        return;
      }

      _lc.storeId = gsnApi.getSelectedStoreId();
      if ( _lc.storeId <= 0 ) return;

      _lc.circular = {};
      _lc.circularIsLoading = true;
      $rootScope.$broadcast( 'gsnevent:circular-loading' );

      var url = gsnApi.getStoreUrl() + '/AllContent/' + _lc.storeId;
      gsnApi.http( {}, url ).then( function ( rst ) {
        if ( rst.success ) {
          _lc.circular = rst.response;
          betterStorage.circular = rst.response;

          // resolve is done inside of method below
          processCircularData();
          _lc.circularIsLoading = false;
        } else {
          _lc.circularIsLoading = false;
          $rootScope.$broadcast( 'gsnevent:circular-failed', rst );
        }
      } );
    };


    returnObj.searchProducts = function ( searchTerm ) {
      var url = gsnApi.getStoreUrl() + '/SearchProduct/' + gsnApi.getSelectedStoreId() + '?q=' + encodeURIComponent( searchTerm );
      return gsnApi.http( {}, url );
    };

    returnObj.searchRecipes = function ( searchTerm ) {
      var url = gsnApi.getStoreUrl() + '/SearchRecipe/' + gsnApi.getChainId() + '?q=' + encodeURIComponent( searchTerm );
      return gsnApi.http( {}, url );
    };

    returnObj.getAvailableVarieties = function ( circularItemId ) {
      var url = gsnApi.getStoreUrl() + '/GetAvailableVarieties/' + circularItemId;
      return gsnApi.http( {}, url );
    };

    returnObj.getQuickSearchItems = function () {
      var url = gsnApi.getStoreUrl() + '/GetQuickSearchItems/' + gsnApi.getChainId();
      return gsnApi.http( _lc.quickSearchItems, url );
    };

    // get all stores from cache
    returnObj.getStores = function () {
      var deferred = $q.defer();
      if ( gsnApi.isNull( _lc.previousGetStore, null ) !== null ) {
        return _lc.previousGetStore.promise;
      }

      _lc.previousGetStore = deferred;
      var storeList = betterStorage.storeList;
      if ( gsnApi.isNull( storeList, [] ).length > 0 ) {
        $timeout( function () {
          _lc.previousGetStore = null;
          parseStoreList( storeList );
          deferred.resolve( {
            success: true,
            response: storeList
          } );
        }, 10 );
      } else {
        $rootScope.$broadcast( 'gsnevent:storelist-loading' );
        gsnApi.getAccessToken().then( function () {
          var url = gsnApi.getStoreUrl() + '/List/' + gsnApi.getChainId();
          $http.get( url, {
            headers: gsnApi.getApiHeaders()
          } ).success( function ( response ) {
            _lc.previousGetStore = null;
            var stores = response;
            parseStoreList( stores, true );
            deferred.resolve( {
              success: true,
              response: stores
            } );
            if ( stores.length > 0 ) {
              $rootScope.$broadcast( 'gsnevent:storelist-loaded' );
            }
          } );
        } );
      }

      return deferred.promise;
    };

    // get the current store
    returnObj.getStore = function () {
      var deferred = $q.defer();
      returnObj.getStores().then( function ( rsp ) {
        var data = gsnApi.mapObject( rsp.response, 'StoreId' );
        var result = data[ gsnApi.getSelectedStoreId() ];
        deferred.resolve( result );
      } );

      return deferred.promise;
    };

    // get item by id
    returnObj.getItem = function ( id ) {
      var result = _cp.itemsById[ id ];
      return ( gsn.isNull( result, null ) !== null ) ? result : null;
    };

    returnObj.getAskTheChef = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/1';
      return gsnApi.http( _lc.faAskTheChef, url );
    };

    returnObj.getFeaturedArticle = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/2';
      return gsnApi.http( _lc.faArticle, url );
    };

    returnObj.getFeaturedVideo = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedVideo/' + gsnApi.getChainId();
      return gsnApi.http( _lc.faVideo, url );
    };

    returnObj.getRecipeVideos = function () {
      var url = gsnApi.getStoreUrl() + '/RecipeVideos/' + gsnApi.getChainId();
      return gsnApi.http( _lc.allVideos, url );
    };

    returnObj.getCookingTip = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/3';
      return gsnApi.http( _lc.faCookingTip, url );
    };

    returnObj.getTopRecipes = function () {
      var url = gsnApi.getStoreUrl() + '/TopRecipes/' + gsnApi.getChainId() + '/' + 50;
      return gsnApi.http( _lc.topRecipes, url );
    };

    returnObj.getFeaturedRecipe = function () {
      var url = gsnApi.getStoreUrl() + '/FeaturedRecipe/' + gsnApi.getChainId();
      return gsnApi.http( _lc.faRecipe, url );
    };

    returnObj.getCoupon = function ( couponId, couponType ) {
      return couponType === 2 ? _cp.manuCouponById[ couponId ] : ( couponType === 10 ? _cp.storeCouponById[ couponId ] : _cp.youtechCouponById[ couponId ] );
    };

    returnObj.getManufacturerCoupons = function () {
      return _lc.manufacturerCoupons;
    };

    returnObj.getManufacturerCouponTotalSavings = function () {
      var url = gsnApi.getStoreUrl() + '/GetManufacturerCouponTotalSavings/' + gsnApi.getChainId();
      return gsnApi.http( _lc.manuCouponTotalSavings, url );
    };

    returnObj.getStates = function () {
      var url = gsnApi.getStoreUrl() + '/GetStates';
      return gsnApi.http( _lc.states, url );
    };

    returnObj.getInstoreCoupons = function () {
      return _lc.instoreCoupons;
    };

    returnObj.getYoutechCoupons = function () {
      return _lc.youtechCoupons;
    };

    returnObj.getRecipe = function ( recipeId ) {
      var url = gsnApi.getStoreUrl() + '/RecipeBy/' + recipeId;
      return gsnApi.http( {}, url );
    };

    returnObj.getStaticContent = function ( contentName ) {
      var url = gsnApi.getStoreUrl() + '/GetPartials/' + gsnApi.getChainId() + '/';
      var storeId = gsnApi.isNull( gsnApi.getSelectedStoreId(), 0 );
      if ( storeId > 0 ) {
        url += storeId + '/';
      }
      url += '?name=' + encodeURIComponent( contentName );

      return gsnApi.http( {}, url );
    };

    returnObj.getPartial = function ( contentName ) {
      if ( !contentName ) {
        contentName = 'Home Page';
      }

      var url = gsnApi.getContentServiceUrl( 'GetPartial' );
      var today = new Date();
      var nocache = today.getFullYear() + '' + today.getMonth() + '' + today.getDate() + '' + today.getHours();
      url += '?name=' + encodeURIComponent( contentName ) + '&nocache=' + nocache;

      return gsnApi.http( {}, url );
    };

    returnObj.getArticle = function ( articleId ) {
      var url = gsnApi.getStoreUrl() + '/ArticleBy/' + articleId;
      return gsnApi.http( {}, url );
    };

    returnObj.getSaleItems = function ( departmentId, categoryId ) {
      var url = gsnApi.getStoreUrl() + '/FilterSaleItem/' + gsnApi.getSelectedStoreId() + '?' + 'departmentId=' + gsnApi.isNull( departmentId, '' ) + '&categoryId=' + gsnApi.isNull( categoryId, '' );
      return gsnApi.http( {}, url );
    };

    returnObj.getInventory = function ( departmentId, categoryId ) {
      var url = gsnApi.getStoreUrl() + '/FilterInventory/' + gsnApi.getSelectedStoreId() + '?' + 'departmentId=' + gsnApi.isNull( departmentId, '' ) + '&categoryId=' + gsnApi.isNull( categoryId, '' );
      return gsnApi.http( {}, url );
    };

    returnObj.getSpecialAttributes = function () {
      var url = gsnApi.getStoreUrl() + '/GetSpecialAttributes/' + gsnApi.getChainId();
      return gsnApi.http( _lc.specialAttributes, url );
    };

    returnObj.getMealPlannerRecipes = function () {
      var url = gsnApi.getStoreUrl() + '/GetMealPlannerRecipes/' + gsnApi.getChainId();
      return gsnApi.http( _lc.mealPlanners, url );
    };

    returnObj.getAdPods = function () {
      var url = gsnApi.getStoreUrl() + '/ListSlots/' + gsnApi.getChainId();
      return gsnApi.http( _lc.adPods, url );
    };

    returnObj.hasCompleteCircular = function () {
      var circ = returnObj.getCircularData();
      var result = false;

      if ( circ ) {
        result = gsnApi.isNull( circ.Circulars, false );
      }

      if ( !result && ( gsnApi.isNull( gsnApi.getSelectedStoreId(), 0 ) > 0 ) ) {
        returnObj.refreshCircular();
        result = false;
      }

      return returnObj.getProcessDate() ? result : null;
    };

    returnObj.getProcessDate = function () {
      return _cp.processCompleted;
    };

    returnObj.getCircularData = function ( forProcessing ) {
      if ( !_lc.circular ) {
        _lc.circular = betterStorage.circular;
        if ( !forProcessing ) {
          processCircularData();
        }
      }

      return _lc.circular;
    };

    returnObj.initialize = function ( isApi ) {
      /// <summary>Initialze store data. this method should be
      /// written such that, it should do a server retrieval when parameter is null.
      /// </summary>

      gsnApi.initApp();

      // call api to get stores
      var config = gsnApi.getConfig();
      var rawStoreList = config.StoreList;
      if ( rawStoreList ) {
        parseStoreList( rawStoreList, true );
      }

      returnObj.getStores();
      if ( config.AllContent ) {
        config.AllContent.Circularz = config.AllContent.Circulars;
        config.AllContent.Circulars = [];
        angular.forEach( config.AllContent.Circularz, function ( circ ) {
          circ.Pagez = circ.Pages;
          circ.Pages = [];
        } );

        betterStorage.circular = config.AllContent;
      }

      if ( returnObj.hasCompleteCircular() ) {
        // async init data
        $timeout( processCircularData, 0 );
      }

      if ( gsnApi.isNull( isApi, null ) !== null ) {
        returnObj.getAdPods();
        returnObj.getManufacturerCouponTotalSavings();
      }
    };

    $rootScope.$on( 'gsnevent:store-setid', function ( event, values ) {
      var storeId = values.newValue;
      var config = gsnApi.getConfig();
      var hasNewStoreId = ( gsnApi.isNull( _lc.storeId, 0 ) !== storeId );
      var requireRefresh = hasNewStoreId && !config.AllContent;

      // attempt to load circular
      if ( hasNewStoreId ) {
        _lc.storeId = storeId;
        _lc.circularIsLoading = false;
      }

      // always call update circular on set storeId or if it has been more than 20 minutes
      var currentTime = new Date().getTime();
      var seconds = ( currentTime - gsnApi.isNull( betterStorage.circularLastUpdate, 0 ) ) / 1000;
      if ( ( requireRefresh && !_lc.circularIsLoading ) || ( seconds > 1200 ) ) {
        returnObj.refreshCircular();
      } else if ( hasNewStoreId ) {
        processCircularData();
      }
    } );

    return returnObj;

    //#region helper methods
    function parseStoreList( storeList, isRaw ) {
      if ( isRaw ) {
        var stores = storeList;
        if ( typeof ( stores ) !== 'string' ) {
          angular.forEach( stores, function ( store ) {
            store.Settings = gsnApi.mapObject( store.StoreSettings, 'StoreSettingId' );
          } );

          betterStorage.storeList = stores;
        }
      }
      var search = $location.search();
      var selectFirstStore = search.sfs || search.selectFirstStore || search.selectfirststore;
      storeList = gsnApi.isNull( storeList, [] );
      var storeByNumber = gsnApi.mapObject( storeList, 'StoreNumber' );
      if ( storeList.length === 1 || selectFirstStore ) {
        if ( storeList[ 0 ].StoreId !== gsnApi.isNull( gsnApi.getSelectedStoreId(), 0 ) ) {
          gsnApi.setSelectedStoreId( storeList[ 0 ].StoreId );
        }
      } else if ( search.storeid ) {
        var storeById = gsnApi.mapObject( storeList, 'StoreId' );
        gsnApi.setSelectedStoreId( storeById[ search.storeid ].StoreId );
      } else if ( search.storenbr ) {
        gsnApi.setSelectedStoreId( storeByNumber[ search.storenbr ].StoreId );
      } else if ( search.store ) {
        var storeByUrl = gsnApi.mapObject( storeList, 'StoreUrl' );
        if ( storeByNumber[ search.store ] ) {
          gsnApi.setSelectedStoreId( storeByNumber[ search.store ].StoreId );
        }
      }
    }

    function processManufacturerCoupon() {
      if ( gsnApi.isNull( _lc.manufacturerCoupons.items, [] ).length > 0 ) return;

      // process manufacturer coupon
      var circular = returnObj.getCircularData();
      _lc.manufacturerCoupons.items = circular.ManufacturerCoupons;
      angular.forEach( _lc.manufacturerCoupons.items, function ( item ) {
        item.CategoryName = gsnApi.isNull( _cp.categoryById[ item.CategoryId ], {
          CategoryName: ''
        } ).CategoryName;
        _cp.manuCouponById[ item.ItemId ] = item;
      } );
      gsnApi.getConfig().hasPrintableCoupon = _lc.manufacturerCoupons.items.length > 0;
    }

    function processInstoreCoupon() {
      var circular = returnObj.getCircularData();
      // process in-store coupon
      var items = [];
      angular.forEach( circular.InstoreCoupons, function ( item ) {
        if ( item.StoreIds.length <= 0 || item.StoreIds.indexOf( _lc.storeId ) >= 0 ) {
          item.CategoryName = gsnApi.isNull( _cp.categoryById[ item.CategoryId ], {
            CategoryName: ''
          } ).CategoryName;
          _cp.storeCouponById[ item.ItemId ] = item;
          items.push( item );
        }
      } );

      gsnApi.getConfig().hasStoreCoupon = items.length > 0;

      _lc.instoreCoupons.items = items;
    }

    function processYoutechCoupon() {
      if ( gsnApi.isNull( _lc.youtechCoupons.items, [] ).length > 0 ) return;

      var circular = returnObj.getCircularData();

      // process youtech coupon
      _lc.youtechCoupons.items = circular.YoutechCoupons;
      angular.forEach( _lc.youtechCoupons.items, function ( item ) {
        item.CategoryName = gsnApi.isNull( _cp.categoryById[ item.CategoryId ], {
          CategoryName: ''
        } ).CategoryName;
        _cp.youtechCouponById[ item.ItemId ] = item;
      } );

      gsnApi.getConfig().hasDigitalCoupon = _lc.youtechCoupons.items.length > 0;
    }

    function processCoupon() {
      if ( _cp ) {
        $timeout( processManufacturerCoupon, 50 );
        $timeout( processInstoreCoupon, 50 );
        $timeout( processYoutechCoupon, 50 );
      }
    }

    function processCircularData( cb ) {
      var circularData = returnObj.getCircularData( true );
      if ( !circularData ) return;
      if ( !circularData.CircularTypes ) return;

      betterStorage.circularLastUpdate = new Date().getTime();
      _lc.storeId = gsnApi.getSelectedStoreId();
      processingQueue.length = 0;

      // process category into key value pair
      processingQueue.push( function () {
        if ( _cp.lastProcessDate === ( new Date().getDate() ) && _cp.categoryById[ -1 ] ) return;

        var categoryById = gsnApi.mapObject( circularData.Categories, 'CategoryId' );

        categoryById[ null ] = {
          CategoryId: null,
          CategoryName: ''
        };
        categoryById[ -1 ] = {
          CategoryId: -1,
          CategoryName: 'Misc. Items'
        };
        categoryById[ -2 ] = {
          CategoryId: -2,
          CategoryName: 'Ingredients'
        };
        _cp.categoryById = categoryById;

        return;
      } );

      var circularTypes = gsnApi.mapObject( circularData.CircularTypes, 'Code' );
      var circularByTypes = [];
      var staticCirculars = [];
      var items = [];
      var circulars = gsnApi.isNull( circularData.Circularz, circularData.Circulars );
      circularData.Circulars = [];

      // foreach Circular
      angular.forEach( circulars, function ( circ ) {
        circ.StoreIds = circ.StoreIds || [];
        circ.CircularTypeName = ( circularTypes[ circ.CircularTypeId ] || {} ).Name;
        if ( circ.StoreIds.length <= 0 || circ.StoreIds.indexOf( _lc.storeId ) >= 0 ) {
          circularData.Circulars.push( circ );
          if ( !circ.Pagez ) {
            circ.Pagez = circ.Pages;
          }

          var pages = circ.Pagez;
          circ.Pages = [];

          angular.forEach( pages, function ( page ) {
            if ( page.StoreIds.length <= 0 || page.StoreIds.indexOf( _lc.storeId ) >= 0 ) {
              circ.Pages.push( page );
            }
          } );

          processCircular( circ, items, circularTypes, staticCirculars, circularByTypes );
        }
      } );

      processingQueue.push( function () {
        // set all items
        circularByTypes.push( {
          CircularTypeId: 99,
          CircularType: 'All Circulars',
          items: items
        } );

        // sort by circulartypeid
        gsnApi.sortOn( circularData.Circulars, 'CircularTypeId' );
        return;
      } );

      // set result
      processingQueue.push( function () {
        _cp.itemsById = gsnApi.mapObject( items, 'ItemId' );
        return;
      } );

      processingQueue.push( function () {
        _cp.circularByTypeId = gsnApi.mapObject( circularByTypes, 'CircularTypeId' );
        return;
      } );

      processingQueue.push( function () {
        _cp.staticCircularById = gsnApi.mapObject( staticCirculars, 'CircularTypeId' );
        return;
      } );

      processingQueue.push( processCoupon );

      processingQueue.push( function () {
        if ( cb ) cb();
        _cp.lastProcessDate = new Date().getDate();
        $rootScope.$broadcast( 'gsnevent:circular-loaded', {
          success: true,
          response: circularData
        } );
        return;
      } );

      processWorkQueue();
    }

    function processWorkQueue() {
      if ( processingQueue.length > 0 ) {
        // this make sure that work get executed in sequential order
        processingQueue.shift()();

        $timeout( processWorkQueue, 50 );
        return;
      }
      _cp.processCompleted = new Date();
      $rootScope.$broadcast( 'gsnevent:circular-processed' );
    }

    function processCircular( circ, items, circularTypes, staticCirculars, circularByTypes ) {
      // process pages
      var pages = circ.Pages;
      var itemCount = 0;
      gsnApi.sortOn( pages, 'PageNumber' );
      circ.pages = pages;
      circ.CircularType = circularTypes[ circ.CircularTypeId ].Name;
      circ.ImageUrl = gsnApi.isNull( circ.ImageUrl, {} ).replace( 'http://', '//' );
      var circularMaster = {
        CircularPageId: pages[ 0 ].CircularPageId,
        CircularType: circ.CircularType,
        CircularTypeId: circ.CircularTypeId,
        ImageUrl: pages[ 0 ].ImageUrl.replace( 'http://', '//' ),
        SmallImageUrl: pages[ 0 ].SmallImageUrl.replace( 'http://', '//' ),
        items: []
      };

      // foreach Page in Circular
      angular.forEach( pages, function ( page ) {
        //var pageCopy = {};
        //angular.extend(pageCopy, page);
        //pageCopy.Items = [];
        itemCount += page.Items.length;
        page.Circular = circ;
        page.ImageUrl = page.ImageUrl.replace( 'http://', '//' );
        page.SmallImageUrl = page.SmallImageUrl.replace( 'http://', '//' );

        processingQueue.push( function () {
          processCircularPage( items, circularMaster, page );
        } );
      } );

      processingQueue.push( function () {
        if ( gsnApi.isNull( itemCount, 0 ) > 0 ) {
          circularByTypes.push( circularMaster );
        } else {
          circularMaster.items = pages;
          staticCirculars.push( circularMaster );
        }
      } );
    }

    function processCircularPage( items, circularMaster, page ) {
      angular.forEach( page.Items, function ( item ) {
        item.PageNumber = parseInt( page.PageNumber );
        item.rect = {
          x: 0,
          y: 0
        };
        var pos = ( item.AreaCoordinates + '' ).split( ',' );
        if ( pos.length > 2 ) {
          var temp = 0;
          for ( var i = 0; i < 4; i++ ) {
            pos[ i ] = parseInt( pos[ i ] ) || 0;
          }
          // swap if bad position
          if ( pos[ 0 ] > pos[ 2 ] ) {
            temp = pos[ 0 ];
            pos[ 0 ] = pos[ 2 ];
            pos[ 2 ] = temp;
          }
          if ( pos[ 1 ] > pos[ 3 ] ) {
            temp = pos[ 1 ];
            pos[ 1 ] = pos[ 3 ];
            pos[ 3 ] = temp;
          }

          item.rect.x = pos[ 0 ];
          item.rect.y = pos[ 1 ];
          item.rect.xx = pos[ 2 ];
          item.rect.yy = pos[ 3 ];
          item.rect.width = pos[ 2 ] - pos[ 0 ]; // width
          item.rect.height = pos[ 3 ] - pos[ 1 ]; // height
          item.rect.cx = item.rect.width / 2; // center
          item.rect.cy = item.rect.height / 2;
        }

        circularMaster.items.push( item );
        item.ImageUrl = item.ImageUrl.replace( 'http://', '//' );
        item.SmallImageUrl = item.ImageUrl.replace( 'upload.gsngrocers.com/', 'upload.brickinc.net/' ).replace( 'upload.brickinc.net/', 'cdn2.brickinc.net/rx/120/up/' );
        item.Quantity = item.Quantity || 1;
        items.push( item );
      } );
    }
    //#endregion
  }
} )( angular );
