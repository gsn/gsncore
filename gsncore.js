/*!
 * gsncore
 * version 1.10.19
 * gsncore repository
 * Build date: Sun Jun 25 2017 10:29:13 GMT-0500 (CDT)
 */
;(function() {
  'use strict';

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `gsn` variable.
  var previousGsn = root.gsn;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice = ArrayProto.slice,
    hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var nativeForEach = ArrayProto.forEach,
    nativeMap = ArrayProto.map,
    nativeSome = ArrayProto.some,
    nativeIndexOf = ArrayProto.indexOf,
    nativeKeys = Object.keys;

  /* jshint -W055 */
  // Create a safe reference to the gsn object for use below.
  var gsn = function(obj) {
    if (obj instanceof gsn) return obj;
    if (!(this instanceof gsn)) return new gsn(obj);
    this._wrapped = obj;
    return this;
  };

  // Export the gsn object for **Node.js**, with
  // backwards-compatibility for the old `require()` API.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = gsn;
    }
    exports.gsn = gsn;
  } else {
    root.gsn = gsn;
  }
  gsn.root = root;
  gsn.previousGsn = previousGsn;

  // internal config
  gsn.config = {
    // url config
    AuthServiceUrl: '/proxy/auth',
    StoreServiceUrl: '/proxy/store',
    ProfileServiceUrl: '/proxy/profile',
    ShoppingListServiceUrl: '/proxy/shoppinglist',
    LoggingServiceUrl: '/proxy/logging',
    YoutechCouponUrl: '/proxy/couponut',
    ApiUrl: '',

    // global config
    Version: new Date().getTime(),
    EmailRegex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ServiceUnavailableMessage: 'We are unable to process your request at this time.',

    // true to make use of localStorage for better caching of user info across session, useful in a phonegap or mobile site app
    UseLocalStorage: false,

    // chain specific config
    ContentBaseUrl: '/asset',

    ChainId: 0,
    ChainName: 'Brick, Inc.',
    GoogleTagId: null,
    GoogleAnalyticAccountId1: null,
    GoogleSiteVerificationId: null,
    RegistrationFromEmailAddress: 'tech@grocerywebsites.com',
    RegistrationEmailLogo: null,
    FacebookAppId: null,
    FacebookPermission: null,
    GoogleSiteSearchCode: null,
    Theme: null,
    HomePage: null,
    StoreList: null,
    AllContent: null,
    hasDigitalCoupon: false,
    hasStoreCoupon: false,
    hasPrintableCoupon: false,
    hasInit: false
  };

  gsn.identity = function(value) {
    return value;
  };

  gsn.userAgent = root.navigator.userAgent;

  function detectIe() {
    var ua = gsn.userAgent;
    var msie = ua.indexOf('MSIE ');
    var trident = ua.indexOf('Trident/');

    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    if (trident > 0) {
      // IE 11 (or newer) => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    // other browser
    return false;
  }
  ;

  gsn.browser = {
    isIE: detectIe(),
    userAgent: gsn.userAgent,
    isMobile: /iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/gi.test(gsn.userAgent),
    isAndroid: /(android)/gi.test(gsn.userAgent),
    isIOS: /iP(hone|od|ad)/gi.test(gsn.userAgent)
  };
  //#region Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = gsn.each = gsn.forEach = function(obj, iterator, context) {
    if (gsn.isNull(obj, null) === null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = gsn.keys(obj);
      for (var j = 0, length2 = keys.length; j < length2; j++) {
        if (iterator.call(context, obj[keys[j]], keys[j], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  gsn.map = gsn.collect = function(obj, iterator, context) {
    var results = [];
    if (gsn.isNull(obj, null) === null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };
  //#endregion

  //#region methods
  // --------------------
  // Extend a given object with all the properties in passed-in object(s).
  // gsn.extend(destination, *source);
  gsn.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (typeof (source) !== 'undefined') {
        gsn.forEach(source, function(v, k) {
          if (gsn.isNull(v, null) !== null) {
            obj[k] = v;
          }
        });
      }
    });
    return obj;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = gsn.some = gsn.any = function(obj, predicate, context) {
    predicate = predicate || gsn.identity;
    var result = false;
    if (gsn.isNull(obj, null) === null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
      return null;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  gsn.contains = gsn.include = function(obj, target) {
    if (gsn.isNull(obj, null) === null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // extend the current config
  gsn.applyConfig = function(config, dontUseProxy) {
    if (!gsn.config.hasInit) {
      gsn.config.hasInit = true;
      gsn.extend(gsn.config, config);
      gsn.config.HomePage = gsn.parsePartialContentData(gsn.config.HomePage);
      var siteMenu = gsn.config.SiteMenu || '';
      if (typeof (siteMenu) == 'string') {
        gsn.config.SiteMenu = siteMenu.length > 10 ? JSON.parse(siteMenu) : [];
        gsn.forEach(gsn.config.SiteMenu, function(v, k) {
          v.Position = parseInt(v.Position);
          gsn.forEach(v.SubMenu, function(v2, k2) {
            v2.Position = parseInt(v2.Position);
          });
        });
      }
    }

    // determine if proxy should be replace with direct url to api
    var useProxy = !gsn.isNull(dontUseProxy, gsn.config.dontUseProxy);

    // use proxy and older android, then it must use proxy
    if (useProxy && gsn.browser.isAndroid) {
      var ua = gsn.browser.userAgent;
      var androidversion = parseFloat(ua.slice(ua.indexOf("Android") + 8));

      if (androidversion > 4) {
        return;
      }

      useProxy = false;
    }

    // if not useProxy, replace proxy with valid api url
    if (!useProxy) {
      gsn.forEach(gsn.config, function(v, k) {
        if (typeof (v) !== 'string' || v == 'ApiUrl') return;
        if (v.indexOf('/proxy/') >= 0) {
          gsn.config[k] = v.replace('/proxy/', gsn.config.ApiUrl + '/');
        }
      });
    }

    config.useProxy = useProxy;
  };

  // return defaultValue if null
  gsn.isNull = function(obj, defaultValue) {
    return (typeof (obj) === 'undefined' || obj === null) ? defaultValue : obj;
  };

  // return defaultValue if NaN
  gsn.isNaN = function(obj, defaultValue) {
    return (isNaN(obj)) ? defaultValue : obj;
  };

  // sort a collection base on a field name
  gsn.sortOn = function(collection, name) {
    if (gsn.isNull(collection, null) === null) return null;
    if (collection.length <= 0) return [];

    // detect attribute type, problem is if your first object is null or not string then this breaks
    if (typeof (collection[0][name]) == 'string') {
      collection.sort(function(a, b) {
        if ((a[name] && a[name].toLowerCase()) < (b[name] && b[name].toLowerCase())) return -1;
        if ((a[name] && a[name].toLowerCase()) > (b[name] && b[name].toLowerCase())) return 1;
        return 0;
      });
    } else {
      collection.sort(function(a, b) {
        if (a[name] < b[name]) return -1;
        if (a[name] > b[name]) return 1;
        return 0;
      });
    }

    return collection;
  };

  // clean keyword - for support of sending keyword to google dfp
  gsn.cleanKeyword = function(keyword) {
    var result = keyword.replace(/[^a-zA-Z0-9]+/gi, '_').replace(/^[_]+/gi, '');
    if (gsn.isNull(result.toLowerCase, null) !== null) {
      result = result.toLowerCase();
    }
    return result;
  };

  // group a list by a field name/attribute and execute post process function
  gsn.groupBy = function(list, attribute, postProcessFunction) {
    if (gsn.isNull(list, null) === null) return [];

    // First, reset declare result.
    var groups = [];
    var grouper = {};

    // this make sure all elements are correctly sorted
    gsn.forEach(list, function(item) {
      var groupKey = item[attribute];
      var group = grouper[groupKey];
      if (gsn.isNull(group, null) === null) {
        group = {
          key: groupKey,
          items: []
        };
        grouper[groupKey] = group;
      }
      group.items.push(item);
    });

    // finally, sort on group
    var i = 0;
    gsn.forEach(grouper, function(myGroup) {
      myGroup.$idx = i++;
      groups.push(myGroup);

      if (postProcessFunction) postProcessFunction(myGroup);
    });

    return gsn.sortOn(groups, 'key');
  };

  // map a list to object, todo: there is this better array map some where
  gsn.mapObject = function(list, attribute) {
    var obj = {};
    if (list) {
      if (gsn.isNull(list.length, -1) < 0) {
        obj[list[attribute]] = list;
      } else {
        gsn.map(list, function(item, i) {
          var k = item[attribute];
          var e = obj[k];
          if (e) {
            if (Object.prototype.toString.call(e) !== '[object Array]') {
              e = [e];
            }
            e.push(item);
          } else {
            e = item;
          }
          obj[k] = e;
        });
      }
    }
    return obj;
  };

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  gsn.keys = nativeKeys || function(obj) {
      if (obj !== Object(obj))
        throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj)
        if (gsn.has(obj, key)) keys.push(key);
      return keys;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  gsn.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // allow for IE compatible delete
  gsn.del = function(obj, key) {
    obj[key] = undefined;
    try {
      delete obj[k];
    } catch (e) {
      var items = {};
      gsn.each(obj, function(v, k) {
        if (k != key)
          items[k] = v;
      });

      return items;
    }
    return obj;
  };

  gsn.getUrl = function(baseUrl, url) {
    url = gsn.isNull(url, '');
    var data = ((url.indexOf('?') > 0) ? '&' : '?') + 'nocache=' + gsn.config.Version;
    return (baseUrl + url + data).replace(/(\\\\)+/gi, '\\');
  };

  // get the content url
  gsn.getContentUrl = function(url) {
    return gsn.getUrl(gsn.config.ContentBaseUrl, url);
  };

  gsn.getThemeUrl = function(url) {
    var baseUrl = gsn.config.ContentBaseUrl;

    if (gsn.isNull(gsn.config.SiteTheme, '').length > 0) {
      baseUrl = baseUrl.replace('/' + gsn.config.ChainId, '/' + gsn.config.SiteTheme);
    }

    return gsn.getUrl(baseUrl, url);
  };

  gsn.getContentServiceUrl = function(url) {
    return gsn.getApiUrl() + '/Content' + gsn.isNull(url, '')
  };

  gsn.getApiUrl = function() {
    return gsn.config.ApiUrl !== '' ? gsn.config.ApiUrl : '/proxy';
  };

  gsn.getMetaUrl = function(meta, metaType) {
    return gsn.getApiUrl() + '/Content/meta/' + gsn.config.ChainId + '/?name=home page&meta=' + encodeURIComponent(meta) + '&type=' + (metaType || 'text/html') + '&nocache=' + gsn.config.Version;
  };

  gsn.setTheme = function(theme) {
    gsn.config.SiteTheme = theme;
  };

  gsn.goUrl = function(url, target) {
    // do nothing, dummy function to be polyfill later
  };

  gsn.initAnalytics = function($analyticsProvider) {
    // GA already supports buffered invocations so we don't need
    // to wrap these inside angulartics.waitForVendorApi
    if ($analyticsProvider.settings) {
      $analyticsProvider.settings.trackRelativePath = true;
    }

    var firstTracker = (gsn.isNull(gsn.config.GoogleAnalyticAccountId1, '').length > 0);

    if (root.ga) {
      // creating google analytic object
      if (firstTracker) {
        ga('create', gsn.config.GoogleAnalyticAccountId1, 'auto');

      }

      // enable demographic
      ga('require', 'displayfeatures');
    }

    // GA already supports buffered invocations so we don't need
    // to wrap these inside angulartics.waitForVendorApi

    $analyticsProvider.registerPageTrack(function(path) {
      // begin tracking
      if (root.ga) {
        ga('send', 'pageview', path);
      }
    });

    /**
    * Track Event in GA
    * @name eventTrack
    *
    * @param {string} action Required 'action' (string) associated with the event
    * @param {object} properties Comprised of the mandatory field 'category' (string) and optional  fields 'label' (string), 'value' (integer) and 'noninteraction' (boolean)
    *
    * @link https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide#SettingUpEventTracking
    *
    * @link https://developers.google.com/analytics/devguides/collection/analyticsjs/events
    */
    $analyticsProvider.registerEventTrack(function(action, properties) {
      // GA requires that eventValue be an integer, see:
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#eventValue
      // https://github.com/luisfarzati/angulartics/issues/81
      if (properties.value) {
        var parsed = parseInt(properties.value, 10);
        properties.value = isNaN(parsed) ? 0 : parsed;
      }

      if (root.ga) {
        ga('send', 'event', properties.category, action, properties.label, properties.value, {
          nonInteraction: 1
        });
      }
    });
  };

  gsn.init = function($locationProvider, $sceDelegateProvider, $sceProvider, $httpProvider, FacebookProvider, $analyticsProvider) {
    gsn.initAngular($sceProvider, $sceDelegateProvider, $locationProvider, $httpProvider, FacebookProvider);
    gsn.initAnalytics($analyticsProvider);
  };

  // support angular initialization
  gsn.initAngular = function($sceProvider, $sceDelegateProvider, $locationProvider, $httpProvider, FacebookProvider) {
    gsn.applyConfig(root.globalConfig.data || {});
    gsn.config.ContentBaseUrl = root.location.port > 1000 && root.location.port < 5000 ? "/asset/" + gsn.config.ChainId : gsn.config.ContentBaseUrl;
    gsn.config.DisableLimitedTimeCoupons = (215 === gsn.config.ChainId);
    if (gsn.config.Theme) {
      gsn.setTheme(gsn.config.Theme);
    }

    //#region security config
    // For security reason, please do not disable $sce
    // instead, please use trustHtml filter with data-ng-bind-html for specific trust
    $sceProvider.enabled(!gsn.browser.isIE && root.location.protocol.indexOf('http') >= 0);

    $sceDelegateProvider.resourceUrlWhitelist(gsn.config.SceWhiteList || [
        'self',
        'http://*.gsn2.com/**',
        'http://*.*.gsn2.com/**',
        'https://*.gsn2.com/**',
        'http://*.gsngrocers.com/**',
        'https://*.gsngrocers.com/**',
        'http://*.trybrick.com/**',
        'https://*.trybrick.com/**',
        'http://*.gsnretailer.com/**',
        'https://*.gsnretailer.com/**',
        'http://*.brickinc.net/**',
        'https://*.brickinc.net/**',
        'http://localhost:*/**',
        'file:///**']);


    //gets rid of the /#/ in the url and allows things like 'bootstrap collapse' to function
    if (typeof ($locationProvider) !== "undefined") {
      $locationProvider.html5Mode(true).hashPrefix('!');
    }

    if (typeof ($httpProvider) !== "undefined") {
      $httpProvider.interceptors.push('gsnAuthenticationHandler');

      // Enable cross domain calls
      $httpProvider.defaults.useXDomain = true;

      // Remove the header used to identify ajax call  that would prevent CORS from working
      $httpProvider.defaults.headers.common['X-Requested-With'] = null;
    }

    if (typeof (FastClick) !== "undefined") {
      FastClick.attach(document.body);
    }

    if (typeof (FacebookProvider) !== "undefined") {
      if (gsn.config.FacebookAppId) {
        if (gsn.config.facebookVersion) {
          FacebookProvider.init({
            appId: gsn.config.FacebookAppId,
            xfbml: true,
            version: gsn.config.facebookVersion
          });
        } else {
          FacebookProvider.init(gsn.config.FacebookAppId);
        }
      }
      else {
        FacebookProvider.init(gsn.config.FacebookAppId, false);
      }
    }
  };
  //#endregion

  if (root.globalConfig) {
    gsn.config.ApiUrl = gsn.isNull(root.globalConfig.apiUrl, '').replace(/\/+$/g, '');
    if (gsn.config.ApiUrl == '') {
      gsn.config.ApiUrl = '/proxy'
    }
  }

  //#region dynamic script loader
  function loadSingleScript(uri, callbackFunc) {
    if (uri.indexOf('//') < 0) {
      uri = 'http:' + uri;
    }

    // Prefix protocol
    if ((root.location || {}).protocol === 'file') {
      uri = uri.replace('https://', 'http://')
    }

    var tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.src = uri;
    if (callbackFunc) {
      tag.onload = maybeDone;
      tag.onreadystatechange = maybeDone; // For IE8-
    }

    document.body.appendChild(tag);

    /* jshint -W040 */
    function maybeDone() {
      if (this.readyState === undefined || this.readyState === 'complete') {
        // Pull the tags out based on the actual element in case IE ever
        // intermingles the onload and onreadystatechange handlers for the same
        // script block before notifying for another one.
        if (typeof (callbackFunc) === 'function') callbackFunc();
      }
    }
  /* jshint +W040 */
  }

  gsn.loadScripts = function(uris, callbackFunc) {
    if (gsn.isNull(uris.length, 0) <= 0) {
      if (typeof (callbackFunc) === 'function') {
        callbackFunc();
      }
    } else {
      if (typeof (uris) == 'string') {
        uris = [uris];
      }

      var toProcess = [].concat(uris);
      processNext();
    }

    function processNext() {
      if (toProcess.length <= 0) {
        if (typeof (callbackFunc) === 'function') {
          callbackFunc();
        }
      } else {
        var item = toProcess[0];
        toProcess.splice(0, 1);
        loadSingleScript(item, processNext);
      }
    }
  };

  gsn.loadIframe = function(parentEl, html) {
    var iframe = document.createElement('iframe');
    parentEl[0].appendChild(iframe);

    /* jshint -W107 */
    if (iframe.contentWindow) {
      iframe.contentWindow.contents = html;
      iframe.src = 'javascript:window["contents"]';
    } else {
      var doc = iframe.document;
      if (iframe.contentDocument)
        doc = iframe.contentDocument;
      doc.open();
      doc.write(html);
      doc.close();
    }
    /* jshint +W107 */

    return iframe;
  };
  //#endregion

  gsn.parsePartialContentData = function(data) {
    if (gsn.isNull(data, null) === null || data === 'null') {
      data = {
        ConfigData: {},
        ContentData: {},
        ContentList: []
      };
    }

    var result = data;
    if (result.ConfigData) {
      return result;
    }

    var configData = [];
    var contentData = [];

    // parse home config
    if (result.Contents) {
      gsn.forEach(result.Contents, function(v, k) {
        if (v.IsMetaData) configData.push(v);
        else contentData.push(v);
      });

      result.Contents = null;
      result.ConfigData = gsn.mapObject(configData, 'Headline') || {};
      result.ContentData = gsn.mapObject(contentData, 'SortBy') || {};
      var contentList = [];
      for (var i = 0; i < contentData.length; i++) {
        contentList.push(contentData[i]);
      }

      if (contentList.length > 0) {
        result.ContentList = gsn.sortOn(contentList, "SortBy");
      }
    }

    result.ConfigData = result.ConfigData || {};
    result.ContentData = result.ContentData || {};
    result.ContentList = result.ContentList || [];

    return result;
  };
}).call(this);

(function(gsn, angular, undefined) {
  'use strict';

  /* fake definition of angular-facebook if there is none */
  angular.module('facebook', []).provider('Facebook', function test() {
    return {
      init: function() {},
      $get: function() {
        return new test();
      }
    };
  });
  angular.module('ui.map', []);
  angular.module('ui.event', []);
  angular.module('ui.utils', []);
  angular.module('ui.keypress', []);
  angular.module('chieffancypants.loadingBar', []);

  var serviceId = 'gsnApi';
  var mygsncore = angular.module('gsn.core', ['ngRoute', 'ngSanitize', 'facebook', 'angulartics', 'ui.event']);

  mygsncore.config(['$locationProvider', '$sceDelegateProvider', '$sceProvider', '$httpProvider', 'FacebookProvider', '$analyticsProvider',
    function($locationProvider, $sceDelegateProvider, $sceProvider, $httpProvider, FacebookProvider, $analyticsProvider) {
      gsn.init($locationProvider, $sceDelegateProvider, $sceProvider, $httpProvider, FacebookProvider, $analyticsProvider)
    }
  ])
    .run(['$rootScope', 'gsnGlobal', 'gsnApi', '$window', function($rootScope, gsnGlobal, gsnApi, $window) {
      var head = angular.element('head');
      var myHtml = '<!--begin:exclude-->\n<!--[if lt IE 10]>\n' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7/html5shiv.min.js"></script>' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/2.2.0/es5-shim.min.js"></script>' +
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/json2/20130526/json2.min.js"></script>' +
        '\n<![endif]-->';
      myHtml += '\n<link href="//cdn.brickinc.net/asset/common/styles/print.css" rel="stylesheet" type="text/css" media="print">';
      myHtml += '\n<!--end:exclude-->\n'
      head.append(myHtml);

      $rootScope.siteMenu = gsnApi.getConfig().SiteMenu;
      $rootScope.win = $window;
      gsnGlobal.init(true);
    }]);

  mygsncore.service(serviceId, ['$rootScope', '$window', '$timeout', '$q', '$http', '$location', '$localStorage', '$sce', gsnApi]);

  function gsnApi($rootScope, $window, $timeout, $q, $http, $location, $localStorage, $sce) {
    var returnObj = {
      previousDefer: null
    };
    var profileStorage = $localStorage;

    $rootScope[serviceId] = returnObj;
    //#region gsn pass-through methods
    returnObj.gsn = gsn;
    gsn.$api = returnObj;

    // return defaultValue if null - isNull(val, defaultIfNull)
    returnObj.isNull = gsn.isNull;

    // return defaultValue if NaN - isNaN(val, defaultIfNaN)
    returnObj.isNaN = gsn.isNaN;

    // sort a collection base on a field name - sortOn(list, 'field')
    returnObj.sortOn = gsn.sortOn;

    // group a list by a field name/attribute - groupBy(list, 'key') - result array with (key, items) property
    returnObj.groupBy = gsn.groupBy;

    // map a list to object, similar to reduce method - mapObject(list, 'key') - result object by key as id
    returnObj.mapObject = gsn.mapObject;

    // iterator method - forEach(list, function(v,k,list));
    returnObj.forEach = angular.forEach;

    // shallow extend method - extend(dest, src)
    returnObj.extend = gsn.extend;

    returnObj.keys = gsn.keys;

    returnObj.getContentUrl = function(url) {
      return $sce.trustAsResourceUrl(gsn.getContentUrl(url));
    };

    returnObj.getThemeUrl = function(url) {
      return $sce.trustAsResourceUrl(gsn.getThemeUrl(url));
    };

    returnObj.cleanKeyword = gsn.cleanKeyword;

    returnObj.loadIframe = gsn.loadIframe;

    returnObj.loadScripts = gsn.loadScripts;

    returnObj.userAgent = gsn.userAgent;

    returnObj.browser = gsn.browser;

    returnObj.parsePartialContentData = gsn.parsePartialContentData;

    returnObj.del = gsn.del;

    returnObj.getMetaUrl = gsn.getMetaUrl;
    //#endregion

    //#region gsn.config pass-through
    returnObj.getConfig = function() {
      return gsn.config;
    };

    returnObj.getApiUrl = gsn.getApiUrl;

    returnObj.getStoreUrl = function() {
      return gsn.config.StoreServiceUrl;
    };

    returnObj.getContentServiceUrl = function(method) {
      var url = gsn.getContentServiceUrl('/' + method + '/' + returnObj.getChainId() + '/' + returnObj.isNull(returnObj.getSelectedStoreId(), '0') + '/');
      if (gsn.config.useProxy) {
        var contentStart = url.indexOf("/api/v1");
        url = url.substring(contentStart + 7);
        url = "/proxy" + url;
        return url;
      }

      return url.replace('https://', $location.protocol() + '://');
    };

    returnObj.getDefaultLayout = function(defaultUrl) {
      if (gsn.config.DefaultLayout) {
        return $sce.trustAsResourceUrl(gsn.config.DefaultLayout);
      }
      return defaultUrl;
    }

    returnObj.getYoutechCouponUrl = function() {
      return gsn.config.YoutechCouponUrl;
    };

    returnObj.getProductServiceUrl = function() {
      return gsn.config.ProductServiceUrl;
    };

    returnObj.getShoppingListApiUrl = function() {
      return gsn.config.ShoppingListServiceUrl;
    };

    returnObj.getProfileApiUrl = function() {
      return gsn.config.ProfileServiceUrl;
    };

    returnObj.getLoggingApiUrl = function() {
      return gsn.config.LoggingServiceUrl;
    };

    returnObj.getUseLocalStorage = function() {
      return returnObj.isNull(gsn.config.UseLocalStorage, false);
    };

    returnObj.getVersion = function() {
      /// <summary>Get the application version</summary>

      return gsn.config.Version;
    };

    returnObj.getGoogleSiteSearchCode = function() {
      return gsn.config.GoogleSiteSearchCode;
    };

    returnObj.getGoogleSiteVerificationId = function() {
      return gsn.config.GoogleSiteVerificationId;
    };

    returnObj.isBetween = function(value, min, max) {
      return value > min && value < max;
    };

    returnObj.getFacebookPermission = function() {
      // if empty, get at least email permission
      return returnObj.isNull(gsn.config.FacebookPermission, 'email');
    };

    returnObj.getGoogleAnalyticAccountId1 = function() {
      return returnObj.isNull(gsn.config.GoogleAnalyticAccountId1, '');
    };

    returnObj.getEmailRegEx = function() {
      return gsn.config.EmailRegex;
    };

    returnObj.getServiceUnavailableMessage = function() {
      return gsn.config.ServiceUnavailableMessage;
    };

    returnObj.getChainId = function() {
      return gsn.config.ChainId;
    };

    returnObj.getChainName = function() {
      return gsn.config.ChainName;
    };

    returnObj.getHomeData = function() {
      return gsn.config.HomePage;
    };

    returnObj.getRegistrationFromEmailAddress = function() {
      return gsn.config.RegistrationFromEmailAddress;
    };

    returnObj.getRegistrationEmailLogo = function() {
      return gsn.config.RegistrationEmailLogo;
    };

    returnObj.htmlFind = function(html, find) {
      return angular.element('<div>' + html + '</div>').find(find).length;
    };

    returnObj.equalsIgnoreCase = function(val1, val2) {
      return angular.lowercase(val1) == angular.lowercase(val2);
    };

    returnObj.toLowerCase = function(str) {
      return angular.lowercase(str);
    };

    returnObj.params = function(obj) {
      var k = gsn.keys(obj);
      var s = "";
      for (var i = 0; i < k.length; i++) {
        s += k[i] + "=" + encodeURIComponent(obj[k[i]]);
        if (i != k.length - 1)
          s += "&";
      }
      return s;
    };

    returnObj.goUrl = function(url, target) {
      /// <summary>go to url</summary>

      try {
        // attempt to hide any modal
        angular.element('.modal').modal('hide');
      } catch (e) {}

      target = returnObj.isNull(target, '');

      if (target == '_blank') {
        $window.open(url, '');
        return;
      } else if (target == '_reload' || target == '_self') {
        if ($window.top) {
          try {
            $window.top.location = url;
          } catch (e) {
            $window.location = url;
          }
        } else {
          $window.location = url;
        }

        return;
      }

      $timeout(function() {
        // allow external call to be in scope apply
        $location.url(url);
      }, 5);
    };

    returnObj.reload = function() {
      returnObj.goUrl($location.url(), '_reload');
    };

    // allow external code to change the url of angular app
    gsn.goUrl = returnObj.goUrl;
    //#endregion

    returnObj.clearSelection = function(items) {
      angular.forEach(items, function(item) {
        item.selected = false;
      });
    };

    returnObj.getBindableItem = function(newItem) {
      var item = angular.copy(newItem);
      item.NewQuantity = item.Quantity || 1;
      if ($rootScope.gsnProfile) {
        var shoppingList = $rootScope.gsnProfile.getShoppingList();
        if (shoppingList) {
          var result = shoppingList.getItem(item);
      if(result)
      result.NewQuantity = result.Quantity || 1;
          return result || item;
        }
      }

      return item;
    };

    returnObj.updateBindableItem = function(item) {
      if (item.ItemId) {
        if ($rootScope.gsnProfile) {
          var shoppingList = $rootScope.gsnProfile.getShoppingList();
          if (shoppingList) {
            item.OldQuantity = item.Quantity;
            item.Quantity = parseInt(item.NewQuantity);
            shoppingList.syncItem(item);
          }
        }
      }
    };

    returnObj.doSiteSearch = function(search) {
      returnObj.goUrl('/search?q=' + encodeURIComponent(search));
    };

    returnObj.doItemSearch = function(search) {
      returnObj.goUrl('/product/search?q=' + encodeURIComponent(search));
    };

    returnObj.decodeServerUrl = function(url) {
      /// <summary>decode url path returned by our server</summary>
      /// <param name="url" type="Object"></param>

      return decodeURIComponent((url + '').replace(/\s+$/, '').replace(/\s+/gi, '-').replace(/(.aspx)$/, ''));
    };

    returnObj.parseStoreSpecificContent = function(contentData) {
      var contentDataResult = {};
      var possibleResult = [];
      var myContentData = contentData;
      var allStoreCount = gsn.config.StoreList.length;
      var storeId = returnObj.isNull(returnObj.getSelectedStoreId(), 0);

      // determine if contentData is array
      if (contentData && contentData.Id) {
        myContentData = [contentData];
      }

      var i = 0;
      angular.forEach(myContentData, function(v, k) {
        var storeIds = returnObj.isNull(v.StoreIds, []);

        // get first content as default or value content without storeids
        if ((i <= 0 || !contentDataResult.Description) && storeIds.length <= 0) {
          contentDataResult = v;
        }
        i++;

        if (storeId <= 0) {
          if (allStoreCount == v.StoreIds.length) {
            contentDataResult = v;
          }

          return;
        }

        angular.forEach(storeIds, function(v1, k1) {
          if (storeId == v1) {
            contentDataResult = v;
            possibleResult.push(v);
          }
        });
      });

      var maxStoreIdCount = allStoreCount;
      if (possibleResult.length > 1) {
        // use result with least number of stores
        angular.forEach(possibleResult, function(v, k) {
          if (v.StoreIds.length > 1 && v.StoreIds.length < maxStoreIdCount) {
            maxStoreIdCount = v.StoreIds.length;
            contentDataResult = v;
          }
        });
      }

      return contentDataResult;
    };

    returnObj.getThemeContent = function(contentPosition) {
      return returnObj.parseStoreSpecificContent(returnObj.getHomeData().ContentData[contentPosition]);
    };

    returnObj.getThemeConfig = function(name) {
      return returnObj.parseStoreSpecificContent(returnObj.getHomeData().ConfigData[name]);
    };

    returnObj.getThemeConfigDescription = function(name, defaultValue) {
      var resultObj = returnObj.getThemeConfig(name).Description;
      return returnObj.isNull(resultObj, defaultValue);
    };

    returnObj.getFullPath = function(path, includePort) {
      var normalizedPath = (returnObj.isNull(path, '') + '').replace(/$\/+/gi, '');
      if (normalizedPath.indexOf('http') > -1) {
        return path;
      }
      if ($location.host() == 'localhost') {
        includePort = true;
      }

      normalizedPath = ($location.protocol() + '://' + $location.host() + (includePort ? ':' + $location.port() : '') + ('/' + normalizedPath).replace(/(\/\/)+/gi, '\/'));
      return normalizedPath;
    };

    returnObj.getPageCount = function(data, pageSize) {
      data = data || [];
      return (Math.ceil(data.length / pageSize) || 1);
    };

    //#region storeId, shoppingListId, anonymousToken, etc...
    returnObj.getSelectedStoreId = function() {
      return profileStorage.storeId || 0;
    };

    returnObj.setSelectedStoreId = function(storeId, newUrl, timeout) {
      // make sure we don't set a bad store id
      var storeIdInt = parseInt(storeId);
      if (returnObj.isNaN(storeIdInt, 0) <= 0) {
        storeId = null;
      }

      var previousStoreId = profileStorage.storeId;
      profileStorage.storeId = storeId;
      $rootScope.$broadcast('gsnevent:store-setid', {
        newValue: storeId,
        oldValue: previousStoreId
      });
      if (newUrl) {
        $timeout(function() {
          returnObj.goUrl(newUrl, '_reload')
        }, timeout || 500);
      }
    };

    returnObj.getProfileId = function() {
      var accessToken = getAccessToken();
      return returnObj.isNaN(parseInt(returnObj.isNull(accessToken.user_id, 0)), 0);
    };

    returnObj.getShoppingListId = function() {
      return returnObj.isNull(profileStorage.shoppingListId, 0);
    };

    returnObj.setShoppingListId = function(shoppingListId, dontBroadcast) {
      profileStorage.shoppingListId = returnObj.isNull(shoppingListId, 0);

      if (dontBroadcast) return;

      $rootScope.$broadcast('gsnevent:shoppinglist-setid', shoppingListId);
    };
    //#endregion

    returnObj.getApiHeaders = function() {
      // assume access token data is available at this point
      var accessTokenData = getAccessToken();
      var payload = {
        "X-SITE-ID": returnObj.getChainId(),
        "X-STORE-ID": returnObj.getSelectedStoreId(),
        "X-PROFILE-ID": returnObj.getProfileId(),
        "X-ACCESS-TOKEN": accessTokenData.access_token,
        'Content-Type': 'application/json'
      };

      return payload;
    };

    returnObj.isAnonymous = function() {
      /// <summary>Determine if a user is logged in.</summary>

      var accessTokenData = getAccessToken();

      return returnObj.isNull(accessTokenData.grant_type, '') == 'anonymous';
    };

    returnObj.isLoggedIn = function() {
      /// <summary>Determine if a user is logged in.</summary>

      var accessTokenData = getAccessToken();

      return returnObj.isNull(accessTokenData.grant_type, '') == 'password';
    };

    gsn.isLoggedIn = returnObj.isLoggedIn;
    gsn.getUserId = returnObj.getProfileId;

    returnObj.logOut = function() {
      /// <summary>Log a user out.</summary>

      // attempt to reset to anonymous token
      var previousProfileId = returnObj.getProfileId();
      var data = getAnonymousToken();
      setAccessToken(data);

      // if invalid anonymous token, cause a login
      if (returnObj.isNull(data.expires_dt, 0) <= 0) {

        // TODO: rethink this as it may cause infinit loop on browser if server is down
        returnObj.getAccessToken();
      }

      $rootScope.$broadcast('gsnevent:logout', {
        ProfileId: previousProfileId
      });
    };

    returnObj.doAuthenticate = function(payload) {
      if (payload) {
        if (!payload.username) {
          payload.username = returnObj.getProfileId();
        }
      }

      // make the auth call
      $http.post(gsn.config.AuthServiceUrl + "/Token2", payload, {
        headers: {
          'Content-Type': 'application/json',
          "X-SHOPPING-LIST-ID": returnObj.getShoppingListId()
        }
      })
        .success(function(response) {
          // Since server automatically send grant_type ('anonymous'/'password') for refresh payload
          // DO NOT SET: response.grant_type = payload.grant_type;
          response.expires_dt = (new Date().getTime()) + 1000 * response.expires_in;

          setAccessToken(response);
          var defer = returnObj.previousDefer;
          if (defer) {
            returnObj.previousDefer = null;
            defer.resolve(response);
          }

          $rootScope.$broadcast('gsnevent:login-success', {
            success: true,
            payload: payload,
            response: response
          });
        }).error(function(response) {
        var refreshTokenFailed = (payload.grant_type == 'refresh_token' && returnObj.isNull(response.ExceptionMessage, '').indexOf('expired') > 0);

        // if refresh failed, it is being handled in 'gsnevent:auth-invalidrefresh'
        if (!refreshTokenFailed) {
          // if anonymous login failed, something must be wrong with the server
          // a message should be display on the UI side?
          $rootScope.$broadcast('gsnevent:login-failed', {
            success: true,
            payload: payload,
            response: response
          });
        }
      });
    };

    returnObj.setAccessToken = setAccessToken;

    returnObj.getAccessToken = function() {
      var deferred = returnObj.isNull(returnObj.previousDefer, null) === null ? $q.defer() : returnObj.previousDefer;

      // check access token
      var accessTokenPayload = getAccessTokenPayload();

      // if valid token, resolve
      if (returnObj.isNull(accessTokenPayload, null) === null) {
        returnObj.previousDefer = null;
        $timeout(function() {
          deferred.resolve({
            success: true,
            response: getAccessToken()
          });
        }, 10);

        return deferred.promise;
      } else {

        // do not proceed if a defer is going on
        if (returnObj.isNull(returnObj.previousDefer, null) !== null) {
          return returnObj.previousDefer.promise;
        }

        returnObj.previousDefer = deferred;
        returnObj.doAuthenticate(accessTokenPayload);
      }

      return deferred.promise;
    };

    // when it doesn't have defer
    //  -- it will create a defer and return promise
    //  -- it will make http request and call defer resolve on success
    // when it has defer or data, it will return the promise
    returnObj.http = function(cacheObject, url, payload) {
      // when it has data, it will simulate resolve and return promise
      // when it doesn't have defer, it will create a defer and trigger request
      // otherwise, just return the promise
      if (cacheObject.response) {
        // small timeout to simulate async
        $timeout(function() {
          cacheObject.deferred.resolve(cacheObject.response);
        }, 50);
      } else if (returnObj.isNull(cacheObject.deferred, null) === null) {
        cacheObject.deferred = $q.defer();
        var successHandler = function(response) {
          cacheObject.response = {
            success: true,
            response: response
          };
          cacheObject.deferred.resolve(cacheObject.response);
        };
        var errorHandler = function(response) {
          cacheObject.response = {
            success: false,
            response: response
          };
          cacheObject.deferred.resolve(cacheObject.response);
        };

        if (url.indexOf('/undefined') > 0) {
          errorHandler('Client error: invalid request.');
        } else {
          returnObj.getAccessToken().then(function() {
            cacheObject.url = url;
            if (payload) {
              $http.post(url, payload, {
                headers: returnObj.getApiHeaders()
              }).success(successHandler).error(errorHandler);
            } else {
              $http.get(url, {
                headers: returnObj.getApiHeaders()
              }).success(successHandler).error(errorHandler);
            }
          });
        }
      }

      return cacheObject.deferred.promise;
    };

    returnObj.httpGetOrPostWithCache = returnObj.http;

    returnObj.isValidCaptcha = function(challenge, response) {
      var defer = $q.defer();
      $http.post(gsn.config.AuthServiceUrl + "/ValidateCaptcha", {
        challenge: challenge,
        response: response
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .success(function(rsp) {
          defer.resolve((rsp == 'true'));
        }).error(function(rsp) {
        defer.resolve(false);
      });
      return defer.promise;
    };

    returnObj.goBack = function() {
      $timeout(function() {
        $window.history.back();
      }, 10);
    };

    returnObj.initApp = function() {
      $rootScope.appState = 'initializing';

      // injecting getContentUrl and getThemeUrl for css
      $rootScope.getContentUrl = returnObj.getContentUrl;
      $rootScope.getThemeUrl = returnObj.getThemeUrl;
      $rootScope.getContentServiceUrl = returnObj.getContentServiceUrl;

      // setting the default layout
      var configData = returnObj.getHomeData().ConfigData;
      if (configData) {
        var layoutConfig = configData.layout;
        if (layoutConfig) {
          $rootScope.defaultLayout = gsn.getThemeUrl('/views/layout' + layoutConfig.Description + '/layout.html');
        }
      }

      var accessTokenData = getAccessToken();
      var hasValidAccessToken = (returnObj.isNull(accessTokenData.expires_dt, 0) > 0 && accessTokenData.expires_dt > new Date().getTime());

      if (!hasValidAccessToken) {
        // get and set to anonymous
        var anonymousTokenData = getAnonymousToken();
        setAccessToken(anonymousTokenData);
      }

      // give the UI 2/10 of a second to be ready
      $timeout(function() {
        $rootScope.appState = 'ready';
      }, 200);
    };

    returnObj.onevent = function(fn) {
      $rootScope.$on('gsnevent:*', fn);
    };

    //#region authentication event handling
    $rootScope.$on('gsnevent:auth-expired', function(evt, args) {
      var accessTokenData = getAccessToken();

      // invalidate the token
      if (accessTokenData.access_token) {
        accessTokenData.expires_dt = 0;
        setAccessToken(accessTokenData);
      }

      // trigger authentication after token invalidation
      returnObj.getAccessToken();
    });

    $rootScope.$on('gsnevent:auth-invalidrefresh', function(evt, args) {
      var accessTokenData = getAccessToken();
      if (accessTokenData.grant_type == 'anonymous') {
        // anonymous refresh expired so clear anonymous token
        setAnonymousToken();
      } else {
        // non-anonymous refresh expired, reset current credential to anonymous
      }

      returnObj.logOut();
      returnObj.reload();
    });
    //#endregion

    return returnObj;

    //#region Internal Methods
    function getAccessTokenPayload() {
      var accessTokenData = getAccessToken();
      var hasValidAccessToken = (returnObj.isNull(accessTokenData.expires_dt, 0) > 0 && accessTokenData.expires_dt > new Date().getTime());

      if (hasValidAccessToken) {
        return null;
      }

      // payload default to anonymous authentication
      var payload = {
        grant_type: "anonymous",
        client_id: returnObj.getChainId(),
        access_type: 'offline'
      };

      // if previous accessToken as refresh_token capability, then try to refresh
      if (typeof (accessTokenData.refresh_token) != 'undefined') {
        payload.grant_type = 'refresh_token';
        payload.refresh_token = accessTokenData.refresh_token;
      }

      return payload;
    }

    function getAccessToken() {
      return returnObj.isNull(profileStorage.accessToken, {});
    }

    function setAccessToken(data) {
      profileStorage.accessToken = data || {};

      if (data) {
        var profileId = parseInt(returnObj.isNull(data.user_id, 0));
        if (returnObj.isNaN(profileId, 0) > 0) {
          $rootScope.$broadcast('gsnevent:profile-setid', profileId);
        }

        // finally store anonymous token
        if (data.grant_type == 'anonymous') {
          setAnonymousToken(data);
        }
      }
    }

    function getAnonymousToken() {
      return returnObj.isNull($localStorage.anonymousToken, {});
    }

    function setAnonymousToken(token) {
      var tk = returnObj.isNull(token, {});

      $localStorage.anonymousToken = tk;
    }

  //#endregion
  }
})(gsn, angular);

'use strict';

(function () {
  var app = angular.module('gsn.core');

  //Setup map events from a google map object to trigger on a given element too,
  //then we just use ui-event to catch events from an element
  function bindMapEvents(scope, eventsStr, googleObject, element) {
    angular.forEach(eventsStr.split(' '), function (eventName) {
      //Prefix all googlemap events with 'map-', so eg 'click'
      //for the googlemap doesn't interfere with a normal 'click' event
      window.google.maps.event.addListener(googleObject, eventName, function (event) {
        element.triggerHandler('map-' + eventName, event);
        //We create an $apply if it isn't happening. we need better support for this
        //We don't want to use timeout because tons of these events fire at once,
        //and we only need one $apply
        if (!scope.$$phase){ scope.$apply();}
      });
    });
  }

  app.value('uiMapConfig', {}).directive('uiMap',
    ['uiMapConfig', '$parse', '$timeout', 'gsnApi', function (uiMapConfig, $parse, $timeout, gsnApi) {

      var mapEvents = 'bounds_changed center_changed click dblclick drag dragend ' +
        'dragstart heading_changed idle maptypeid_changed mousemove mouseout ' +
        'mouseover projection_changed resize rightclick tilesloaded tilt_changed ' +
        'zoom_changed';
      var options = uiMapConfig || {};

      return {
        restrict: 'A',
        //doesn't work as E for unknown reason
        link: function (scope, elm, attrs) {
          function activate() {

            var gmap = (window.google || {}).maps || {};
            if ((typeof( gmap.Geocoder ) === 'undefined') 
              || (typeof( gmap.InfoWindow ) === 'undefined')
              || (typeof( gmap.Map ) === 'undefined'))
            {
              // wait until it is defined
              $timeout(activate, 100);
              return;
            }
            
            // wait for uiOptions
            if (!attrs.uiOptions) {
              $timeout(activate, 100);
              return;
            }

            var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
            var map = new window.google.maps.Map(elm[0], opts);
            var model = $parse(attrs.uiMap);

            //Set scope variable for the map
            model.assign(scope, map);

            bindMapEvents(scope, mapEvents, map, elm);
          }

          activate();
        }
      };
    }]);

  app.value('uiMapInfoWindowConfig', {}).directive('uiMapInfoWindow',
    ['uiMapInfoWindowConfig', '$parse', '$compile', '$timeout', function (uiMapInfoWindowConfig, $parse, $compile, $timeout) {

      var infoWindowEvents = 'closeclick content_change domready ' +
        'position_changed zindex_changed';
      var options = uiMapInfoWindowConfig || {};

      return {
        link: function (scope, elm, attrs) {
          function activate() {
            var gmap = (window.google || {}).maps || {};
            if ((typeof( gmap.Geocoder ) === 'undefined') 
              || (typeof( gmap.InfoWindow ) === 'undefined')
              || (typeof( gmap.Map ) === 'undefined'))
            {
              // wait until it is defined
              $timeout(activate, 100);
              return;
            }

            var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
            opts.content = elm[0];
            var model = $parse(attrs.uiMapInfoWindow);
            var infoWindow = model(scope);

            if (!infoWindow) {
              infoWindow = new window.google.maps.InfoWindow(opts);
              model.assign(scope, infoWindow);
            }

            bindMapEvents(scope, infoWindowEvents, infoWindow, elm);

            /* The info window's contents dont' need to be on the dom anymore,
             google maps has them stored.  So we just replace the infowindow element
             with an empty div. (we don't just straight remove it from the dom because
             straight removing things from the dom can mess up angular) */
            elm.replaceWith('<div></div>');

            //Decorate infoWindow.open to $compile contents before opening
            var _open = infoWindow.open;
            infoWindow.open = function open(a1, a2, a3, a4, a5, a6) {
              $compile(elm.contents())(scope);
              _open.call(infoWindow, a1, a2, a3, a4, a5, a6);
            };
          }

          activate();
        }
      };
    }]);

  /*
   * Map overlay directives all work the same. Take map marker for example
   * <ui-map-marker="myMarker"> will $watch 'myMarker' and each time it changes,
   * it will hook up myMarker's events to the directive dom element.  Then
   * ui-event will be able to catch all of myMarker's events. Super simple.
   */
  function mapOverlayDirective(directiveName, events) {
    app.directive(directiveName, [function () {
      return {
        restrict: 'A',
        link: function (scope, elm, attrs) {
          scope.$watch(attrs[directiveName], function (newObject) {
            if (newObject) {
              bindMapEvents(scope, events, newObject, elm);
            }
          });
        }
      };
    }]);
  }

  mapOverlayDirective('uiMapMarker',
    'animation_changed click clickable_changed cursor_changed ' +
      'dblclick drag dragend draggable_changed dragstart flat_changed icon_changed ' +
      'mousedown mouseout mouseover mouseup position_changed rightclick ' +
      'shadow_changed shape_changed title_changed visible_changed zindex_changed');

  mapOverlayDirective('uiMapPolyline',
    'click dblclick mousedown mousemove mouseout mouseover mouseup rightclick');

  mapOverlayDirective('uiMapPolygon',
    'click dblclick mousedown mousemove mouseout mouseover mouseup rightclick');

  mapOverlayDirective('uiMapRectangle',
    'bounds_changed click dblclick mousedown mousemove mouseout mouseover ' +
      'mouseup rightclick');

  mapOverlayDirective('uiMapCircle',
    'center_changed click dblclick mousedown mousemove ' +
      'mouseout mouseover mouseup radius_changed rightclick');

  mapOverlayDirective('uiMapGroundOverlay',
    'click dblclick');

})();
/**
 * angular-recaptcha build:2013-10-17 
 * https://github.com/vividcortex/angular-recaptcha 
 * Copyright (c) 2013 VividCortex 
**/

/**
* Modified by Tom Nguyen
* For lazy loading of google recaptcha library
**/
/*global angular, Recaptcha */
(function (angular, undefined) {
  'use strict';

  var app = angular.module('gsn.core');

  /**
   * An angular service to wrap the reCaptcha API
   */
  app.service('vcRecaptchaService', ['$timeout', '$log', '$q', '$window', 'gsnApi', function ($timeout, $log, $q, $window, gsnApi) {

    /**
     * The reCaptcha callback
     */
    var callback, loadingScript;

    return {

      /**
       * Creates a new reCaptcha object
       *
       * @param elm  the DOM element where to put the captcha
       * @param key  the recaptcha public key (refer to the README file if you don't know what this is)
       * @param fn   a callback function to call when the captcha is resolved
       * @param conf the captcha object configuration
       */
      create: function (elm, key, fn, conf) {
        callback = fn;
        conf.callback = fn;

        function loadRecaptcha() {
          Recaptcha.create(
              key,
              elm,
              conf
          );
        }
        
        if (typeof(Recaptcha) === 'undefined') {
          $timeout(loadRecaptcha, 500);

          if (loadingScript) return;
          loadingScript = true;

          // dynamically load google
          var src = '//www.google.com/recaptcha/api/js/recaptcha_ajax.js';
          gsnApi.loadScripts([src], loadRecaptcha);
          return;
        }

        loadRecaptcha();
      },

      /**
       * Reloads the captcha (updates the challenge)
       *
       * @param should_focus pass TRUE if the recaptcha should gain the focus after reloading
       */
      reload: function (should_focus) {

        // $log.info('Reloading captcha');
        Recaptcha.reload(should_focus && 't');

        /**
         * Since the previous call is asynch, we need again the same hack. See directive code.
         * @TODO Investigate another way to know when the new captcha is loaded
         * @see https://github.com/VividCortex/angular-recaptcha/issues/4
         * @see https://groups.google.com/forum/#!topic/recaptcha/6b7k866qzD0
         */
        $timeout(callback, 1000);
      },

      data: function () {
        return {
          response: Recaptcha.get_response(),
          challenge: Recaptcha.get_challenge()
        };
      },

      destroy: function () {
        Recaptcha.destroy();
      }
    };

  }]);

}(angular));

/*global angular, Recaptcha */
(function (angular) {
  'use strict';

  var app = angular.module('gsn.core');

  app.directive('vcRecaptcha', ['$log', '$timeout', 'vcRecaptchaService', function ($log, $timeout, vcRecaptchaService) {

    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, elm, attrs, ctrl) {

        // $log.info("Creating recaptcha with theme=%s and key=%s", attrs.theme, attrs.key);

        if (!attrs.hasOwnProperty('key') || attrs.key.length !== 40) {
          throw 'You need to set the "key" attribute to your public reCaptcha key. If you don\'t have a key, please get one from https://www.google.com/recaptcha/admin/create';
        }

        var
            response_input, challenge_input,
            refresh = function () {
              if (ctrl) {
                ctrl.$setViewValue({ response: response_input.val(), challenge: challenge_input.val() });
              }
            },
            reload = function () {
              var inputs = elm.find('input');
              challenge_input = angular.element(inputs[0]); // #recaptcha_challenge_field
              response_input = angular.element(inputs[1]); // #recaptcha_response_field
              refresh();
            },
            callback = function () {
              // $log.info('Captcha rendered');

              reload();

              response_input.bind('keyup', function () {
                scope.$apply(refresh);
              });

              // model -> view
              if (ctrl) {
                ctrl.$render = function () {
                  response_input.val(ctrl.$viewValue.response);
                  challenge_input.val(ctrl.$viewValue.challenge);
                };
              }

              // Capture the click even when the user requests for a new captcha
              // We give some time for the new captcha to render
              // This is kind of a hack, we should think on a better way to do this
              // Probably checking for the image to change and if not, trigger the timeout again
              elm.bind('click', function () {
                // $log.info('clicked');
                $timeout(function () {
                  scope.$apply(reload);
                }, 1000);
              });
            };
        
        vcRecaptchaService.create(
            elm[0],
            attrs.key,
            callback,
            {
              tabindex: attrs.tabindex,
              theme: attrs.theme,
              lang: attrs.lang || null
            }
        );
      }
    };
  }]);

}(angular));

/*
---
name: Facebook Angularjs

description: Provides an easier way to make use of Facebook API with Angularjs

license: MIT-style license

authors:
  - Ciul

requires: [angular]
provides: [facebook]

...
*/
(function(window, angular, undefined) {
  'use strict';

  // Module global settings.
  var settings = {};

  // Module global flags.
  var flags = {
    sdk: false,
    ready: false
  };

  // Module global loadDeferred
  var loadDeferred;

  /**
   * Facebook module
   */
  angular.module('facebook', []).

    // Declare module settings value
    value('settings', settings).

    // Declare module flags value
    value('flags', flags).

    /**
     * Facebook provider
     */
    provider('Facebook', [
      function() {

        /**
         * Facebook appId
         * @type {Number}
         */
        settings.appId = null;

        this.setAppId = function(appId) {
          settings.appId = appId;
        };

        this.getAppId = function() {
          return settings.appId;
        };

        /**
         * Locale language, english by default
         * @type {String}
         */
        settings.locale = 'en_US';

        this.setLocale = function(locale) {
          settings.locale = locale;
        };

        this.getLocale = function() {
          return settings.locale;
        };

        /**
         * Set if you want to check the authentication status
         * at the start up of the app
         * @type {Boolean}
         */
        settings.status = true;

        this.setStatus = function(status) {
          settings.status = status;
        };

        this.getStatus = function() {
          return settings.status;
        };

        /**
         * Adding a Channel File improves the performance of the javascript SDK,
         * by addressing issues with cross-domain communication in certain browsers.
         * @type {String}
         */
        settings.channelUrl = null;

        this.setChannel = function(channel) {
          settings.channelUrl = channel;
        };

        this.getChannel = function() {
          return settings.channelUrl;
        };

        /**
         * Enable cookies to allow the server to access the session
         * @type {Boolean}
         */
        settings.cookie = true;

        this.setCookie = function(cookie) {
          settings.cookie = cookie;
        };

        this.getCookie = function() {
          return settings.cookie;
        };

        /**
         * Parse XFBML
         * @type {Boolean}
         */
        settings.xfbml = true;

        this.setXfbml = function(enable) {
          settings.xfbml = enable;
        };

        this.getXfbml = function() {
          return settings.xfbml;
        };

        /**
         * Auth Response
         * @type {Object}
         */
        settings.authResponse = true;

        this.setAuthResponse = function(obj) {
          settings.authResponse = obj || true;
        };

        this.getAuthResponse = function() {
          return settings.authResponse;
        };

        /**
         * Frictionless Requests
         * @type {Boolean}
         */
        settings.frictionlessRequests = false;

        this.setFrictionlessRequests = function(enable) {
          settings.frictionlessRequests = enable;
        };

        this.getFrictionlessRequests = function() {
          return settings.frictionlessRequests;
        };

        /**
         * HideFlashCallback
         * @type {Object}
         */
        settings.hideFlashCallback = null;

        this.setHideFlashCallback = function(obj) {
          settings.hideFlashCallback = obj || null;
        };

        this.getHideFlashCallback = function() {
          return settings.hideFlashCallback;
        };

        /**
         * Custom option setting
         * key @type {String}
         * value @type {*}
         * @return {*}
         */
        this.setInitCustomOption = function(key, value) {
          if (!angular.isString(key)) {
            return false;
          }

          settings[key] = value;
          return settings[key];
        };

        /**
         * get init option
         * @param  {String} key
         * @return {*}
         */
        this.getInitOption = function(key) {
          // If key is not String or If non existing key return null
          if (!angular.isString(key) || !settings.hasOwnProperty(key)) {
            return false;
          }

          return settings[key];
        };

        /**
         * load SDK
         */
        settings.loadSDK = true;

        this.setLoadSDK = function(a) {
          settings.loadSDK = !!a;
        };

        this.getLoadSDK = function() {
          return settings.loadSDK;
        };

        /**
         * Init Facebook API required stuff
         * This will prepare the app earlier (on settingsuration)
         * @arg {Object/String} initSettings
         * @arg {Boolean} _loadSDK (optional, true by default)
         */
        this.init = function(initSettings, _loadSDK) {
          // If string is passed, set it as appId
          if (angular.isString(initSettings)) {
            settings.appId = initSettings || settings.appId;
          }

          // If object is passed, merge it with app settings
          if (angular.isObject(initSettings)) {
            angular.extend(settings, initSettings);
          }

          // Set if Facebook SDK should be loaded automatically or not.
          if (angular.isDefined(_loadSDK)) {
            settings.loadSDK = !!_loadSDK;
          }
        };

        /**
         * This defined the Facebook service
         */
        this.$get = [
          '$q',
          '$rootScope',
          '$timeout',
          '$window',
          function($q, $rootScope, $timeout, $window) {
            /**
             * This is the NgFacebook class to be retrieved on Facebook Service request.
             */
            function NgFacebook() {
              this.appId = settings.appId;
            }

            /**
             * Ready state method
             * @return {Boolean}
             */
            NgFacebook.prototype.isReady = function() {
              return flags.ready;
            };

            /**
             * Map some asynchronous Facebook sdk methods to NgFacebook
             */
            angular.forEach([
              'login',
              'logout',
              'api',
              'ui',
              'getLoginStatus'
            ], function(name) {
              NgFacebook.prototype[name] = function() {

                var d = $q.defer(),
                    args = Array.prototype.slice.call(arguments), // Converts arguments passed into an array
                    userFn,
                    userFnIndex;

                // Get user function and it's index in the arguments array, to replace it with custom function, allowing the usage of promises
                angular.forEach(args, function(arg, index) {
                  if (angular.isFunction(arg)) {
                    userFn = arg;
                    userFnIndex = index;
                  }
                });

                // Replace user function intended to be passed to the Facebook API with a custom one
                // for being able to use promises.
                if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                  args.splice(userFnIndex, 1, function(response) {
                    $timeout(function() {
                      if (angular.isUndefined(response.error)) {
                        d.resolve(response);
                      } else {
                        d.reject(response);
                      }

                      if (angular.isFunction(userFn)) {
                        userFn(response);
                      }
                    });
                  });
                }

                $timeout(function() {
                  // Call when loadDeferred be resolved, meaning Service is ready to be used.
                  loadDeferred.promise.then(function() {
                    $window.FB[name].apply(FB, args);
                  }, function() {
                    throw 'Facebook API could not be initialized properly';
                  });
                });

                return d.promise;
              };
            });

            /**
             * Map Facebook sdk XFBML.parse() to NgFacebook.
             */
            NgFacebook.prototype.parseXFBML = function() {

              var d = $q.defer();

              $timeout(function() {
                // Call when loadDeferred be resolved, meaning Service is ready to be used
                loadDeferred.promise.then(function() {
                  $window.FB.parse();
                  d.resolve();
                }, function() {
                  throw 'Facebook API could not be initialized properly';
                });
              });

              return d.promise;
            };

            /**
             * Map Facebook sdk subscribe method to NgFacebook. Renamed as subscribe
             * Thus, use it as Facebook.subscribe in the service.
             */
            NgFacebook.prototype.subscribe = function() {

              var d = $q.defer(),
                  args = Array.prototype.slice.call(arguments), // Get arguments passed into an array
                  userFn,
                  userFnIndex;

              // Get user function and it's index in the arguments array, to replace it with custom function, allowing the usage of promises
              angular.forEach(args, function(arg, index) {
                if (angular.isFunction(arg)) {
                  userFn = arg;
                  userFnIndex = index;
                }
              });

              // Replace user function intended to be passed to the Facebook API with a custom one
              // for being able to use promises.
              if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                args.splice(userFnIndex, 1, function(response) {
                  $timeout(function() {
                    if (angular.isUndefined(response.error)) {
                      d.resolve(response);
                    } else {
                      d.reject(response);
                    }

                    if (angular.isFunction(userFn)) {
                      userFn(response);
                    }
                  });
                });
              }

              $timeout(function() {
                // Call when loadDeferred be resolved, meaning Service is ready to be used
                loadDeferred.promise.then(function() {
                  $window.FB.Event.subscribe.apply(FB, args);
                }, function() {
                  throw 'Facebook API could not be initialized properly';
                });
              });

              return d.promise;
            };

            /**
             * Map Facebook sdk unsubscribe method to NgFacebook. Renamed as unsubscribe
             * Thus, use it as Facebook.unsubscribe in the service.
             */
            NgFacebook.prototype.unsubscribe = function() {

              var d = $q.defer(),
                  args = Array.prototype.slice.call(arguments), // Get arguments passed into an array
                  userFn,
                  userFnIndex;

              // Get user function and it's index in the arguments array, to replace it with custom function, allowing the usage of promises
              angular.forEach(args, function(arg, index) {
                if (angular.isFunction(arg)) {
                  userFn = arg;
                  userFnIndex = index;
                }
              });

              // Replace user function intended to be passed to the Facebook API with a custom one
              // for being able to use promises.
              if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                args.splice(userFnIndex, 1, function(response) {
                  $timeout(function() {
                    if (angular.isUndefined(response.error)) {
                      d.resolve(response);
                    } else {
                      d.reject(response);
                    }

                    if (angular.isFunction(userFn)) {
                      userFn(response);
                    }
                  });
                });
              }

              $timeout(function() {
                // Call when loadDeferred be resolved, meaning Service is ready to be used
                loadDeferred.promise.then(
                  function() {
                    $window.FB.Event.unsubscribe.apply(FB, args);
                  },
                  function() {
                    throw 'Facebook API could not be initialized properly';
                  }
                );
              });

              return d.promise;
            };

            return new NgFacebook(); // Singleton
          }
        ];

      }
    ]).

    /**
     * Module initialization
     */
    run([
      '$rootScope',
      '$q',
      '$window',
      '$timeout',
      function($rootScope, $q, $window, $timeout) {
        // Define global loadDeffered to notify when Service callbacks are safe to use
        loadDeferred = $q.defer();

        var loadSDK = settings.loadSDK;
        delete(settings['loadSDK']); // Remove loadSDK from settings since this isn't part from Facebook API.

        /**
         * Define fbAsyncInit required by Facebook API
         */
        $window.fbAsyncInit = function() {
          // Initialize our Facebook app
          $timeout(function() {
            if (!settings.appId) {
              throw 'Missing appId setting.';
            }

            FB.init(settings);

            // Set ready global flag
            flags.ready = true;


            /**
             * Subscribe to Facebook API events and broadcast through app.
             */
            angular.forEach({
              'auth.login': 'login',
              'auth.logout': 'logout',
              'auth.prompt': 'prompt',
              'auth.sessionChange': 'sessionChange',
              'auth.statusChange': 'statusChange',
              'auth.authResponseChange': 'authResponseChange',
              'xfbml.render': 'xfbmlRender',
              'edge.create': 'like',
              'edge.remove': 'unlike',
              'comment.create': 'comment',
              'comment.remove': 'uncomment'
            }, function(mapped, name) {
              FB.Event.subscribe(name, function(response) {
                $timeout(function() {
                  $rootScope.$broadcast('Facebook:' + mapped, response);
                });
              });
            });

            // Broadcast Facebook:load event
            $rootScope.$broadcast('Facebook:load');

            loadDeferred.resolve(FB);

          });
        };

        /**
         * Inject Facebook root element in DOM
         */
        (function addFBRoot() {
          var fbroot = document.getElementById('fb-root');

          if (!fbroot) {
            fbroot = document.createElement('div');
            fbroot.id = 'fb-root';
            document.body.insertBefore(fbroot, document.body.childNodes[0]);
          }

          return fbroot;
        })();

        /**
         * SDK script injecting
         */
         if(loadSDK) {
          (function injectScript() {
            var src           = '//connect.facebook.net/' + settings.locale + '/all.js',
                script        = document.createElement('script');
                script.id     = 'facebook-jssdk';
                script.async  = true;

            // Prefix protocol
            if ($window.location.protocol === 'file') {
              src = 'https:' + src;
            }

            script.src = src;
            script.onload = function() {
              flags.sdk = true; // Set sdk global flag
            };

            document.getElementsByTagName('head')[0].appendChild(script); // // Fix for IE < 9, and yet supported by lattest browsers
          })();
        }
      }
    ]);

})(window, angular);
/**
 * @license Angulartics v0.19.2
 * (c) 2013 Luis Farzati http://luisfarzati.github.io/angulartics
 * License: MIT
 */
!function(a, b) {
  "use strict";
  var c = window.angulartics || (window.angulartics = {});
  c.waitForVendorCount = 0, c.waitForVendorApi = function(a, b, d, e, f) {
    f || c.waitForVendorCount++, e || (e = d, d = void 0), !Object.prototype.hasOwnProperty.call(window, a) || void 0 !== d && void 0 === window[a][d] ? setTimeout(function() {
      c.waitForVendorApi(a, b, d, e, !0)
    }, b) : (c.waitForVendorCount--, e(window[a]))
  }, a.module("angulartics", []).provider("$analytics", function() {
    var b = {
        pageTracking: {
          autoTrackFirstPage: !0,
          autoTrackVirtualPages: !0,
          trackRelativePath: !1,
          autoBasePath: !1,
          basePath: ""
        },
        eventTracking: {},
        bufferFlushDelay: 1e3,
        developerMode: !1
      },
      d = ["pageTrack", "eventTrack", "setAlias", "setUsername", "setUserProperties", "setUserPropertiesOnce", "setSuperProperties", "setSuperPropertiesOnce"],
      e = {},
      f = {},
      g = function(a) {
        return function() {
          c.waitForVendorCount && (e[a] || (e[a] = []), e[a].push(arguments))
        }
      },
      h = function(b, c) {
        return f[b] || (f[b] = []), f[b].push(c), function() {
            var c = arguments;
            a.forEach(f[b], function(a) {
              a.apply(this, c)
            }, this)
          }
      },
      i = {
        settings: b
      },
      j = function(a, b) {
        b ? setTimeout(a, b) : a()
      },
      k = {
        $get: function() {
          return i
        },
        api: i,
        settings: b,
        virtualPageviews: function(a) {
          this.settings.pageTracking.autoTrackVirtualPages = a
        },
        firstPageview: function(a) {
          this.settings.pageTracking.autoTrackFirstPage = a
        },
        withBase: function(b) {
          this.settings.pageTracking.basePath = b ? a.element(document).find("base").attr("href") : ""
        },
        withAutoBase: function(a) {
          this.settings.pageTracking.autoBasePath = a
        },
        developerMode: function(a) {
          this.settings.developerMode = a
        }
      },
      l = function(c, d) {
        i[c] = h(c, d);
        var f = b[c],
          g = f ? f.bufferFlushDelay : null,
          k = null !== g ? g : b.bufferFlushDelay;
        a.forEach(e[c], function(a, b) {
          j(function() {
            d.apply(this, a)
          }, b * k)
        })
      },
      m = function(a) {
        return a.replace(/^./, function(a) {
          return a.toUpperCase()
        })
      },
      n = function(a) {
        var b = "register" + m(a);
        k[b] = function(b) {
          l(a, b)
        }, i[a] = h(a, g(a))
      };
    return a.forEach(d, n), k
  }).run(["$rootScope", "$window", "$analytics", "$injector", function(b, c, d, e) {
    d.settings.pageTracking.autoTrackFirstPage && e.invoke(["$location", function(a) {
      var b = !0;
      if (e.has("$route")) {
        var f = e.get("$route");
        for (var g in f.routes) {
          b = !1;break
        }
      } else if (e.has("$state")) {
        var h = e.get("$state");
        for (var i in h.get()) {
          b = !1;break
        }
      }
      if (b)
        if (d.settings.pageTracking.autoBasePath && (d.settings.pageTracking.basePath = c.location.pathname), d.settings.pageTracking.trackRelativePath) {
          var j = d.settings.pageTracking.basePath + a.url();
          d.pageTrack(j, a)
        } else d.pageTrack(a.absUrl(), a)
    }]), d.settings.pageTracking.autoTrackVirtualPages && e.invoke(["$location", function(a) {
      d.settings.pageTracking.autoBasePath && (d.settings.pageTracking.basePath = c.location.pathname + "#"), e.has("$route") && b.$on("$routeChangeSuccess", function(b, c) {
        if (!c || !(c.$$route || c).redirectTo) {
          var e = d.settings.pageTracking.basePath + a.url();
          d.pageTrack(e, a)
        }
      }), e.has("$state") && b.$on("$stateChangeSuccess", function(b, c) {
        var e = d.settings.pageTracking.basePath + a.url();
        d.pageTrack(e, a)
      })
    }]), d.settings.developerMode && a.forEach(d, function(a, b) {
      "function" == typeof a && (d[b] = function() {})
    })
  }]).directive("analyticsOn", ["$analytics", function(b) {
    function c(a) {
      return ["a:", "button:", "button:button", "button:submit", "input:button", "input:submit"].indexOf(a.tagName.toLowerCase() + ":" + (a.type || "")) >= 0
    }
    function d(a) {
      return c(a), "click"
    }
    function e(a) {
      return c(a) ? a.innerText || a.value : a.id || a.name || a.tagName
    }
    function f(a) {
      return "analytics" === a.substr(0, 9) && -1 === ["On", "Event", "If", "Properties", "EventType"].indexOf(a.substr(9))
    }
    function g(a) {
      var b = a.slice(9);return "undefined" != typeof b && null !== b && b.length > 0 ? b.substring(0, 1).toLowerCase() + b.substring(1) : b
    }
    return {
      restrict: "A",
      link: function(c, h, i) {
        var j = i.analyticsOn || d(h[0]),
          k = {};
        a.forEach(i.$attr, function(a, b) {
          f(b) && (k[g(b)] = i[b], i.$observe(b, function(a) {
            k[g(b)] = a
          }))
        }), a.element(h[0]).bind(j, function(d) {
          var f = i.analyticsEvent || e(h[0]);
          k.eventType = d.type, (!i.analyticsIf || c.$eval(i.analyticsIf)) && (i.analyticsProperties && a.extend(k, c.$eval(i.analyticsProperties)), b.eventTrack(f, k))
        })
      }
    }
  }])
}(angular);

/**
 * @license Angulartics v0.19.2
 * (c) 2013 Luis Farzati http://luisfarzati.github.io/angulartics
 * Google Tag Manager Plugin Contributed by http://github.com/danrowe49
 * License: MIT
 */
!function(a) {
  "use strict";a.module("angulartics").config(["$analyticsProvider", function(a) {
    a.registerPageTrack(function(a) {
      var b = window.dataLayer = window.dataLayer || [];
      b.push({
        event: "content-view",
        "content-name": a
      })
    }), a.registerEventTrack(function(a, b) {
      var c = window.dataLayer = window.dataLayer || [];
      c.push({
        event: "interaction",
        target: b.category,
        action: a,
        "target-properties": b.label,
        value: b.value,
        "interaction-type": b.noninteraction
      })
    })
  }])
}(angular);

(function(angular) {
  'use strict';

  /**
   * @ngdoc overview
   * @name angulartics.clicky
   * Adds support for Clicky analytics (http://clicky.com/).
   * Custom logging is a premium Clicky feature. To use this plugin,
   * clicky needs to be configured to disable automatic pageview logging
   * and history logging:
   *
   * ````
   * var clicky_custom = { pageview_disable : 1, history_disable : 1 };
   * ````
   */
  angular.module('angulartics').config([
    '$analyticsProvider', '$documentProvider', function($analyticsProvider, $documentProvider) {

      var clickyApi;
      var $document = $documentProvider.$get;

      $analyticsProvider.settings.pageTracking.trackRelativePath = true;

      angulartics.waitForVendorApi('clicky', 100, registerEvents);

      /**
       * Register Clicky page and event tracking
       * @param {function} clicky - the clicky API function
       */
      function registerEvents(clicky) {

        clickyApi = clicky;

        if (clickyApi) {
          $analyticsProvider.registerPageTrack(pageTrack);
          $analyticsProvider.registerEventTrack(eventTrack);
        }

      }

      /**
       * Track pageview with Clicky
       * @param {string} path
       */
      function pageTrack(path, properties) {
        var title = properties.title || $document[0].title;
        var type = validateType(properties.type);
        clickyApi.log(path, title, type);
      }

      /**
       * registerEventTrack handler. If `properties.goal` is defined, a clicky.goal() is logged,
       * otherwise the clicky.log() is used.
       * @param action
       * @param properties
       */
      function eventTrack(action, properties) {

        // goals parameters
        var goalId, revenue, noQueue;

        // log parameters
        var title, type;

        // if a goal is sent, use the Clicky goal method, otherwise reroute to log
        if (angular.isDefined(properties.goal)) {

          goalId = properties.goal;
          revenue = validateNumber(properties.revenue) ? properties.revenue : undefined;
          noQueue = !!properties.noQueue;
          clickyApi.goal(goalId, revenue, noQueue);

        } else {
          // since `type` is a Clicky keyword, prefer `preoperties.type` over the eventType
          type = (validateType(properties.type) === properties.type) ? properties.type : 'click';

          // use the title if set, otherwise default to value
          title = properties.title || properties.value;
          var data = '';
          if (properties.category) {
            data += "&ec=" + properties.category; //encodeURIComponent(properties.category);
          }

          if (properties.label) {
            data += "&el=" + properties.label; //encodeURIComponent(properties.label);
          }

          if (data) {
            action = '/evt/' + action + data.replace('&', '?');
          }

          clickyApi.log(action, title, type);
        }
      }

      /**
       * Validates against Clicky's enumerated values for the page type.
       * The default type is `click`, but we're choosing a default of
       * `pageview` since pageTrack happens during route change
       * @param type
       * @returns {boolean|string}
       * @link http://clicky.com/help/customization/manual#log
       */
      function validateType(type) {
        var TYPE_ENUM = ['click', 'download', 'outbound', 'pageview'];

        return (TYPE_ENUM.indexOf(type) >= 0) ? type : 'pageview';
      }

      /**
       * Returns true if a finite number
       * @param number
       * @returns {boolean}
       */
      function validateNumber(number) {
        return typeof number === 'number' && isFinite(number);
      }

    }
  ]);

})(angular);
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

/*
 * flowplayer.js The Flowplayer API
 *
 * Copyright 2009-2011 Flowplayer Oy
 *
 * This file is part of Flowplayer.
 *
 * Flowplayer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Flowplayer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Flowplayer.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
!function(){function h(p){console.log("$f.fireEvent",[].slice.call(p))}function l(r){if(!r||typeof r!="object"){return r}var p=new r.constructor();for(var q in r){if(r.hasOwnProperty(q)){p[q]=l(r[q])}}return p}function n(u,r){if(!u){return}var p,q=0,s=u.length;if(s===undefined){for(p in u){if(r.call(u[p],p,u[p])===false){break}}}else{for(var t=u[0];q<s&&r.call(t,q,t)!==false;t=u[++q]){}}return u}function c(p){return document.getElementById(p)}function j(r,q,p){if(typeof q!="object"){return r}if(r&&q){n(q,function(s,t){if(!p||typeof t!="function"){r[s]=t}})}return r}function o(t){var r=t.indexOf(".");if(r!=-1){var q=t.slice(0,r)||"*";var p=t.slice(r+1,t.length);var s=[];n(document.getElementsByTagName(q),function(){if(this.className&&this.className.indexOf(p)!=-1){s.push(this)}});return s}}function g(p){p=p||window.event;if(p.preventDefault){p.stopPropagation();p.preventDefault()}else{p.returnValue=false;p.cancelBubble=true}return false}function k(r,p,q){r[p]=r[p]||[];r[p].push(q)}function e(p){return p.replace(/&amp;/g,"%26").replace(/&/g,"%26").replace(/=/g,"%3D")}function f(){return"_"+(""+Math.random()).slice(2,10)}var i=function(u,s,t){var r=this,q={},v={};r.index=s;if(typeof u=="string"){u={url:u}}j(this,u,true);n(("Begin*,Start,Pause*,Resume*,Seek*,Stop*,Finish*,LastSecond,Update,BufferFull,BufferEmpty,BufferStop").split(","),function(){var w="on"+this;if(w.indexOf("*")!=-1){w=w.slice(0,w.length-1);var x="onBefore"+w.slice(2);r[x]=function(y){k(v,x,y);return r}}r[w]=function(y){k(v,w,y);return r};if(s==-1){if(r[x]){t[x]=r[x]}if(r[w]){t[w]=r[w]}}});j(this,{onCuepoint:function(y,x){if(arguments.length==1){q.embedded=[null,y];return r}if(typeof y=="number"){y=[y]}var w=f();q[w]=[y,x];if(t.isLoaded()){t._api().fp_addCuepoints(y,s,w)}return r},update:function(x){j(r,x);if(t.isLoaded()){t._api().fp_updateClip(x,s)}var w=t.getConfig();var y=(s==-1)?w.clip:w.playlist[s];j(y,x,true)},_fireEvent:function(w,z,x,B){if(w=="onLoad"){n(q,function(C,D){if(D[0]){t._api().fp_addCuepoints(D[0],s,C)}});return false}B=B||r;if(w=="onCuepoint"){var A=q[z];if(A){return A[1].call(t,B,x)}}if(z&&"onBeforeBegin,onMetaData,onMetaDataChange,onStart,onUpdate,onResume".indexOf(w)!=-1){j(B,z);if(z.metaData){if(!B.duration){B.duration=z.metaData.duration}else{B.fullDuration=z.metaData.duration}}}var y=true;n(v[w],function(){y=this.call(t,B,z,x)});return y}});if(u.onCuepoint){var p=u.onCuepoint;r.onCuepoint.apply(r,typeof p=="function"?[p]:p);delete u.onCuepoint}n(u,function(w,x){if(typeof x=="function"){k(v,w,x);delete u[w]}});if(s==-1){t.onCuepoint=this.onCuepoint}};var m=function(q,s,r,u){var p=this,t={},v=false;if(u){j(t,u)}n(s,function(w,x){if(typeof x=="function"){t[w]=x;delete s[w]}});j(this,{animate:function(z,A,y){if(!z){return p}if(typeof A=="function"){y=A;A=500}if(typeof z=="string"){var x=z;z={};z[x]=A;A=500}if(y){var w=f();t[w]=y}if(A===undefined){A=500}s=r._api().fp_animate(q,z,A,w);return p},css:function(x,y){if(y!==undefined){var w={};w[x]=y;x=w}s=r._api().fp_css(q,x);j(p,s);return p},show:function(){this.display="block";r._api().fp_showPlugin(q);return p},hide:function(){this.display="none";r._api().fp_hidePlugin(q);return p},toggle:function(){this.display=r._api().fp_togglePlugin(q);return p},fadeTo:function(z,y,x){if(typeof y=="function"){x=y;y=500}if(x){var w=f();t[w]=x}this.display=r._api().fp_fadeTo(q,z,y,w);this.opacity=z;return p},fadeIn:function(x,w){return p.fadeTo(1,x,w)},fadeOut:function(x,w){return p.fadeTo(0,x,w)},getName:function(){return q},getPlayer:function(){return r},_fireEvent:function(x,w,y){if(x=="onUpdate"){var A=r._api().fp_getPlugin(q);if(!A){return}j(p,A);delete p.methods;if(!v){n(A.methods,function(){var C=""+this;p[C]=function(){var D=[].slice.call(arguments);var E=r._api().fp_invoke(q,C,D);return E==="undefined"||E===undefined?p:E}});v=true}}var B=t[x];if(B){var z=B.apply(p,w);if(x.slice(0,1)=="_"){delete t[x]}return z}return p}})};function b(r,H,u){var x=this,w=null,E=false,v,t,G=[],z={},y={},F,s,q,D,p,B;j(x,{id:function(){return F},isLoaded:function(){return(w!==null&&w.fp_play!==undefined&&!E)},getParent:function(){return r},hide:function(I){if(I){r.style.height="0px"}if(x.isLoaded()){w.style.height="0px"}return x},show:function(){r.style.height=B+"px";if(x.isLoaded()){w.style.height=p+"px"}return x},isHidden:function(){return x.isLoaded()&&parseInt(w.style.height,10)===0},load:function(K){if(!x.isLoaded()&&x._fireEvent("onBeforeLoad")!==false){var I=function(){if(v&&!flashembed.isSupported(H.version)){r.innerHTML=""}if(K){K.cached=true;k(y,"onLoad",K)}flashembed(r,H,{config:u})};var J=0;n(a,function(){this.unload(function(L){if(++J==a.length){I()}})})}return x},unload:function(K){if(v.replace(/\s/g,"")!==""){if(x._fireEvent("onBeforeUnload")===false){if(K){K(false)}return x}E=true;try{if(w){if(w.fp_isFullscreen()){w.fp_toggleFullscreen()}w.fp_close();x._fireEvent("onUnload")}}catch(I){}var J=function(){w=null;r.innerHTML=v;E=false;if(K){K(true)}};if(/WebKit/i.test(navigator.userAgent)&&!/Chrome/i.test(navigator.userAgent)){setTimeout(J,0)}else{J()}}else{if(K){K(false)}}return x},getClip:function(I){if(I===undefined){I=D}return G[I]},getCommonClip:function(){return t},getPlaylist:function(){return G},getPlugin:function(I){var K=z[I];if(!K&&x.isLoaded()){var J=x._api().fp_getPlugin(I);if(J){K=new m(I,J,x);z[I]=K}}return K},getScreen:function(){return x.getPlugin("screen")},getControls:function(){return x.getPlugin("controls")._fireEvent("onUpdate")},getLogo:function(){try{return x.getPlugin("logo")._fireEvent("onUpdate")}catch(I){}},getPlay:function(){return x.getPlugin("play")._fireEvent("onUpdate")},getConfig:function(I){return I?l(u):u},getFlashParams:function(){return H},loadPlugin:function(L,K,N,M){if(typeof N=="function"){M=N;N={}}var J=M?f():"_";x._api().fp_loadPlugin(L,K,N,J);var I={};I[J]=M;var O=new m(L,null,x,I);z[L]=O;return O},getState:function(){return x.isLoaded()?w.fp_getState():-1},play:function(J,I){var K=function(){if(J!==undefined){x._api().fp_play(J,I)}else{x._api().fp_play()}};if(x.isLoaded()){K()}else{if(E){setTimeout(function(){x.play(J,I)},50)}else{x.load(function(){K()})}}return x},getVersion:function(){var J="flowplayer.js @VERSION";if(x.isLoaded()){var I=w.fp_getVersion();I.push(J);return I}return J},_api:function(){if(!x.isLoaded()){throw"Flowplayer "+x.id()+" not loaded when calling an API method"}return w},setClip:function(I){n(I,function(J,K){if(typeof K=="function"){k(y,J,K);delete I[J]}else{if(J=="onCuepoint"){$f(r).getCommonClip().onCuepoint(I[J][0],I[J][1])}}});x.setPlaylist([I]);return x},getIndex:function(){return q},bufferAnimate:function(I){w.fp_bufferAnimate(I===undefined||I);return x},_swfHeight:function(){return w.clientHeight}});n(("Click*,Load*,Unload*,Keypress*,Volume*,Mute*,Unmute*,PlaylistReplace,ClipAdd,Fullscreen*,FullscreenExit,Error,MouseOver,MouseOut").split(","),function(){var I="on"+this;if(I.indexOf("*")!=-1){I=I.slice(0,I.length-1);var J="onBefore"+I.slice(2);x[J]=function(K){k(y,J,K);return x}}x[I]=function(K){k(y,I,K);return x}});n(("pause,resume,mute,unmute,stop,toggle,seek,getStatus,getVolume,setVolume,getTime,isPaused,isPlaying,startBuffering,stopBuffering,isFullscreen,toggleFullscreen,reset,close,setPlaylist,addClip,playFeed,setKeyboardShortcutsEnabled,isKeyboardShortcutsEnabled").split(","),function(){var I=this;x[I]=function(K,J){if(!x.isLoaded()){return x}var L=null;if(K!==undefined&&J!==undefined){L=w["fp_"+I](K,J)}else{L=(K===undefined)?w["fp_"+I]():w["fp_"+I](K)}return L==="undefined"||L===undefined?x:L}});x._fireEvent=function(R){if(typeof R=="string"){R=[R]}var S=R[0],P=R[1],N=R[2],M=R[3],L=0;if(u.debug){h(R)}if(!x.isLoaded()&&S=="onLoad"&&P=="player"){w=w||c(s);p=x._swfHeight();n(G,function(){this._fireEvent("onLoad")});n(z,function(T,U){U._fireEvent("onUpdate")});t._fireEvent("onLoad")}if(S=="onLoad"&&P!="player"){return}if(S=="onError"){if(typeof P=="string"||(typeof P=="number"&&typeof N=="number")){P=N;N=M}}if(S=="onContextMenu"){n(u.contextMenu[P],function(T,U){U.call(x)});return}if(S=="onPluginEvent"||S=="onBeforePluginEvent"){var I=P.name||P;var J=z[I];if(J){J._fireEvent("onUpdate",P);return J._fireEvent(N,R.slice(3))}return}if(S=="onPlaylistReplace"){G=[];var O=0;n(P,function(){G.push(new i(this,O++,x))})}if(S=="onClipAdd"){if(P.isInStream){return}P=new i(P,N,x);G.splice(N,0,P);for(L=N+1;L<G.length;L++){G[L].index++}}var Q=true;if(typeof P=="number"&&P<G.length){D=P;var K=G[P];if(K){Q=K._fireEvent(S,N,M)}if(!K||Q!==false){Q=t._fireEvent(S,N,M,K)}}n(y[S],function(){Q=this.call(x,P,N);if(this.cached){y[S].splice(L,1)}if(Q===false){return false}L++});return Q};function C(){if($f(r)){$f(r).getParent().innerHTML="";q=$f(r).getIndex();a[q]=x}else{a.push(x);q=a.length-1}B=parseInt(r.style.height,10)||r.clientHeight;F=r.id||"fp"+f();s=H.id||F+"_api";H.id=s;v=r.innerHTML;if(typeof u=="string"){u={clip:{url:u}}}u.playerId=F;u.clip=u.clip||{};if(r.getAttribute("href",2)&&!u.clip.url){u.clip.url=r.getAttribute("href",2)}if(u.clip.url){u.clip.url=e(u.clip.url)}t=new i(u.clip,-1,x);u.playlist=u.playlist||[u.clip];var J=0;n(u.playlist,function(){var M=this;if(typeof M=="object"&&M.length){M={url:""+M}}if(M.url){M.url=e(M.url)}n(u.clip,function(N,O){if(O!==undefined&&M[N]===undefined&&typeof O!="function"){M[N]=O}});u.playlist[J]=M;M=new i(M,J,x);G.push(M);J++});n(u,function(M,N){if(typeof N=="function"){if(t[M]){t[M](N)}else{k(y,M,N)}delete u[M]}});n(u.plugins,function(M,N){if(N){z[M]=new m(M,N,x)}});if(!u.plugins||u.plugins.controls===undefined){z.controls=new m("controls",null,x)}z.canvas=new m("canvas",null,x);v=r.innerHTML;function L(M){if(/iPad|iPhone|iPod/i.test(navigator.userAgent)&&!/.flv$/i.test(G[0].url)&&!K()){return true}if(!x.isLoaded()&&x._fireEvent("onBeforeClick")!==false){x.load()}return g(M)}function K(){return x.hasiPadSupport&&x.hasiPadSupport()}function I(){if(v.replace(/\s/g,"")!==""){if(r.addEventListener){r.addEventListener("click",L,false)}else{if(r.attachEvent){r.attachEvent("onclick",L)}}}else{if(r.addEventListener&&!K()){r.addEventListener("click",g,false)}x.load()}}setTimeout(I,0)}if(typeof r=="string"){var A=c(r);if(!A){throw"Flowplayer cannot access element: "+r}r=A;C()}else{C()}}var a=[];function d(p){this.length=p.length;this.each=function(r){n(p,r)};this.size=function(){return p.length};var q=this;for(name in b.prototype){q[name]=function(){var r=arguments;q.each(function(){this[name].apply(this,r)})}}}window.flowplayer=window.$f=function(){var q=null;var p=arguments[0];if(!arguments.length){n(a,function(){if(this.isLoaded()){q=this;return false}});return q||a[0]}if(arguments.length==1){if(typeof p=="number"){return a[p]}else{if(p=="*"){return new d(a)}n(a,function(){if(this.id()==p.id||this.id()==p||this.getParent()==p){q=this;return false}});return q}}if(arguments.length>1){var u=arguments[1],r=(arguments.length==3)?arguments[2]:{};if(typeof u=="string"){u={src:u}}u=j({bgcolor:"#000000",version:[10,1],expressInstall:"http://releases.flowplayer.org/swf/expressinstall.swf",cachebusting:false},u);if(typeof p=="string"){if(p.indexOf(".")!=-1){var t=[];n(o(p),function(){t.push(new b(this,l(u),l(r)))});return new d(t)}else{var s=c(p);return new b(s!==null?s:l(p),l(u),l(r))}}else{if(p){return new b(p,l(u),l(r))}}}return null};j(window.$f,{fireEvent:function(){var q=[].slice.call(arguments);var r=$f(q[0]);return r?r._fireEvent(q.slice(1)):null},addPlugin:function(p,q){b.prototype[p]=q;return $f},each:n,extend:j});if(typeof jQuery=="function"){jQuery.fn.flowplayer=function(r,q){if(!arguments.length||typeof arguments[0]=="number"){var p=[];this.each(function(){var s=$f(this);if(s){p.push(s)}});return arguments.length?p[arguments[0]]:new d(p)}return this.each(function(){$f(this,l(r),q?l(q):{})})}}}();!function(){var h=document.all,j="http://get.adobe.com/flashplayer",c=typeof jQuery=="function",e=/(\d+)[^\d]+(\d+)[^\d]*(\d*)/,b={width:"100%",height:"100%",id:"_"+(""+Math.random()).slice(9),allowfullscreen:true,allowscriptaccess:"always",quality:"high",version:[3,0],onFail:null,expressInstall:null,w3c:false,cachebusting:false};if(window.attachEvent){window.attachEvent("onbeforeunload",function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){}})}function i(m,l){if(l){for(var f in l){if(l.hasOwnProperty(f)){m[f]=l[f]}}}return m}function a(f,n){var m=[];for(var l in f){if(f.hasOwnProperty(l)){m[l]=n(f[l])}}return m}window.flashembed=function(f,m,l){if(typeof f=="string"){f=document.getElementById(f.replace("#",""))}if(!f){return}if(typeof m=="string"){m={src:m}}return new d(f,i(i({},b),m),l)};var g=i(window.flashembed,{conf:b,getVersion:function(){var m,f,o;try{o=navigator.plugins["Shockwave Flash"];if(o[0].enabledPlugin!=null){f=o.description.slice(16)}}catch(p){try{m=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");f=m&&m.GetVariable("$version")}catch(n){try{m=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");f=m&&m.GetVariable("$version")}catch(l){}}}f=e.exec(f);return f?[1*f[1],1*f[(f[1]*1>9?2:3)]*1]:[0,0]},asString:function(l){if(l===null||l===undefined){return null}var f=typeof l;if(f=="object"&&l.push){f="array"}switch(f){case"string":l=l.replace(new RegExp('(["\\\\])',"g"),"\\$1");l=l.replace(/^\s?(\d+\.?\d*)%/,"$1pct");return'"'+l+'"';case"array":return"["+a(l,function(o){return g.asString(o)}).join(",")+"]";case"function":return'"function()"';case"object":var m=[];for(var n in l){if(l.hasOwnProperty(n)){m.push('"'+n+'":'+g.asString(l[n]))}}return"{"+m.join(",")+"}"}return String(l).replace(/\s/g," ").replace(/\'/g,'"')},getHTML:function(o,l){o=i({},o);var n='<object width="'+o.width+'" height="'+o.height+'" id="'+o.id+'" name="'+o.id+'"';if(o.cachebusting){o.src+=((o.src.indexOf("?")!=-1?"&":"?")+Math.random())}if(o.w3c||!h){n+=' data="'+o.src+'" type="application/x-shockwave-flash"'}else{n+=' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'}n+=">";if(o.w3c||h){n+='<param name="movie" value="'+o.src+'" />'}o.width=o.height=o.id=o.w3c=o.src=null;o.onFail=o.version=o.expressInstall=null;for(var m in o){if(o[m]){n+='<param name="'+m+'" value="'+o[m]+'" />'}}var p="";if(l){for(var f in l){if(l[f]){var q=l[f];p+=f+"="+(/function|object/.test(typeof q)?g.asString(q):q)+"&"}}p=p.slice(0,-1);n+='<param name="flashvars" value=\''+p+"' />"}n+="</object>";return n},isSupported:function(f){return k[0]>f[0]||k[0]==f[0]&&k[1]>=f[1]}});var k=g.getVersion();function d(f,n,m){if(g.isSupported(n.version)){f.innerHTML=g.getHTML(n,m)}else{if(n.expressInstall&&g.isSupported([6,65])){f.innerHTML=g.getHTML(i(n,{src:n.expressInstall}),{MMredirectURL:encodeURIComponent(location.href),MMplayerType:"PlugIn",MMdoctitle:document.title})}else{if(!f.innerHTML.replace(/\s/g,"")){f.innerHTML="<h2>Flash version "+n.version+" or greater is required</h2><h3>"+(k[0]>0?"Your version is "+k:"You have no flash plugin installed")+"</h3>"+(f.tagName=="A"?"<p>Click here to download latest version</p>":"<p>Download latest version from <a href='"+j+"'>here</a></p>");if(f.tagName=="A"||f.tagName=="DIV"){f.onclick=function(){location.href=j}}}if(n.onFail){var l=n.onFail.call(this);if(typeof l=="string"){f.innerHTML=l}}}}if(h){window[n.id]=document.getElementById(n.id)}i(this,{getRoot:function(){return f},getOptions:function(){return n},getConf:function(){return m},getApi:function(){return f.firstChild}})}if(c){jQuery.tools=jQuery.tools||{version:"@VERSION"};jQuery.tools.flashembed={conf:b};jQuery.fn.flashembed=function(l,f){return this.each(function(){$(this).data("flashembed",flashembed(this,l,f))})}}}();
/*!
 *  Project:        Digital Circular
 *  Description:    create a digital circular
 *  Author:         Tom Noogen
 *  License:        Copyright 2014 - Grocery Shƒopping Network 
 *  Version:        1.0.9
 *
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function($, window, document, undefined) {

  // undefined is used here as the undefined global variable in ECMAScript 3 is
  // mutable (ie. it can be changed by someone else). undefined isn't really being
  // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
  // can no longer be modified.

  // window and document are passed through as local variable rather than global
  // as this (slightly) quickens the resolution process and can be more efficiently
  // minified (especially when both are regularly referenced in your plugin).

  // Create the defaults once
  var pluginName = "digitalCirc",
    defaults = {
      data: null,
      browser: null,
      onItemSelect: null,
      onCircularDisplaying: null,
      onCircularDisplayed: null,
      templateCircularList: '<div class="dcircular-list">' +
        ' <div class="dcircular-list-content">' +
        '   {{#Circulars}}<div class="col-md-4 col-sm-6 dcircular-list-single"> ' +
        '      <a class="thumbnail dcircular-thumbnail" href="javascript:void(0)" onclick="gsn.goUrl(\'?c={{CircularIndex}}&p=1\')">' +
        '     <img class="dcircular-image" alt="" src="{{SmallImageUrl}}"> ' +
        '     <div class="caption dcircular-caption"><h3 style="width: 100%; text-align: center;">{{CircularTypeName}}</h3></div>' +
        '     </a>' +
        '   </div>{{/Circulars}}' +
        ' </div>' +
        '</div><div class="dcircular-single"></div>',
      templateLinkBackToList: '{{#if HasMultipleCircular}}<a href="javascript:void(0)" onclick="gsn.goUrl(\'?\')" class="dcircular-back-to-list">&larr; Choose Another Ad</a><br />{{/if}}',
      templatePagerTop: '<div class="dcircular-pager dcircular-pager-top"><ul class="pagination"><li><a href="javascript:void(0)" aria-label="Previous" class="pager-previous">' +
        '<span aria-hidden="true">&laquo;</span></a></li>{{#Circular.Pages}}<li{{#ifeq PageIndex ../CurrentPageIndex}} class="active"{{/ifeq}}>' +
        '<a href="?c={{CircularIndex}}&p={{PageIndex}}">{{PageIndex}}</a></li>{{/Circular.Pages}}<li><a href="javascript:void(0)" aria-label="Next" class="pager-next"><span aria-hidden="true">&raquo;</span></a></li></ul></div>',
      templatePagerBottom: '<div class="dcircular-pager dcircular-pager-bottom"><ul class="pagination"><li><a href="javascript:void(0)" aria-label="Previous" class="pager-previous">' +
        '<span aria-hidden="true">&laquo;</span></a></li>{{#Circular.Pages}}<li{{#ifeq PageIndex ../CurrentPageIndex}} class="active"{{/ifeq}}>' +
        '<a href="?c={{CircularIndex}}&p={{PageIndex}}">{{PageIndex}}</a></li>{{/Circular.Pages}}<li><a href="javascript:void(0)" aria-label="Next" class="pager-next"><span aria-hidden="true">&raquo;</span></a></li></ul></div>',
      templateCircularSingle: '<div class="dcircular-content">' +
        '<img usemap="#dcircularMap{{CurrentPageIndex}}" src="{{Page.ImageUrl}}" class="dcircular-map-image"/>' +
        '<map name="dcircularMap{{CurrentPageIndex}}">' +
        '{{#Page.Items}}<area shape="rect" data-circularitemid="{{ItemId}}" coords="{{AreaCoordinates}}">{{/Page.Items}}' +
        '</map>' +
        ' </div>',
      templateCircularPopup: '<div class="dcircular-popup-content" data-circularitemid="{{ItemId}}">' +
        '   <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 thumbnail dcircular-popup-thumbnail" style="padding-left: 5px;"><img alt="{{Description}}" src="{{ImageUrl}}" class="dcircular-popup-image"/></div>' +
        '   <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8 dcircular-popup-content">' +
        '     <h4 style="word-wrap: normal;" class=" dcircular-popup-caption">{{Description}}</h2>' +
        '     <h6>{{ItemDescription}}</h3>' +
        '     <h5>{{PriceString}}</h4>' +
        '</div>',
      templateCircularPopupTitle: 'Click to add to your shopping list'
    };

  // The actual plugin constructor
  function Plugin(element, options) {
    /// <summary>Plugin constructor</summary>
    /// <param name="element" type="Object">Dom element</param>
    /// <param name="options" type="Object">Initialization option</param>

    this.element = element;

    Handlebars.registerHelper('ifeq', function(v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // jQuery has an extend method which merges the contents of two or
    // more objects, storing the result in the first object. The first object
    // is generally empty as we don't want to alter the default options for
    // future instances of the plugin
    this.settings = $.extend({}, defaults, options);

    // compile templates
    this._templateCircList = Handlebars.compile(this.settings.templateCircularList);
    this._templateCircPopup = Handlebars.compile(this.settings.templateCircularPopup);
    this._templateCircPopupTitle = Handlebars.compile(this.settings.templateCircularPopupTitle);
    this._templateCircSingle = Handlebars.compile(this.settings.templateLinkBackToList +
      this.settings.templatePagerTop +
      this.settings.templateCircularSingle +
      this.settings.templatePagerBottom);

    this._defaults = defaults;
    this._name = pluginName;
    this._circularItemById = {};
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      /// <summary>Initialization logic</summary>

      // preprocess the data
      // parse circular type
      var circularTypeById = {};
      var myData = this.settings.data;
      for (var t = 0; t < myData.CircularTypes.length; t++) {
        circularTypeById[myData.CircularTypes[t].Code] = myData.CircularTypes[t];
      }

      // parse item
      this._circularItemById = {};
      for (var i = 0; i < myData.Circulars.length; i++) {
        var circular = myData.Circulars[i];
        circular.CircularIndex = i + 1;
        myData.Circulars[i].CircularTypeName = circularTypeById[myData.Circulars[i].CircularTypeId].Name;
        myData.Circulars[i].SmallImageUrl = circular.Pages[0].SmallImageUrl;
        for (var j = 0; j < circular.Pages.length; j++) {
          var page = circular.Pages[j];
          page.PageIndex = j + 1;
          page.CircularIndex = i + 1;
          for (var k = 0; k < page.Items.length; k++) {
            var item = page.Items[k];
            this._circularItemById[item.ItemId] = item;
          }
        }
      }

      // create the multiple circular on the dom
      var $this = this;
      var htmlCirc = $this._templateCircList(myData);
      var el = $(this.element);
      el.html(htmlCirc);

      if (typeof ($this.settings.onCircularInit) === 'function') {
        try {
          if ($this.settings.onCircularInit($this)) {
            return;
          }
        } catch (e) {}
      }
      var search = window.location.search.replace('?', '');
      if (window.location.hash) {
        var hash = window.location.hash;
        var sqi = hash.indexOf('?');
        if (sqi > 0) {
          search = hash.substr(sqi);
        }
      }

      var searches = search.replace('?', '').split('&');
      var q = {};
      for (var i = 0; i < searches.length; i++) {
        var qv = searches[i].split('=');
        q[qv[0]] = qv[1];
      }
      if (myData.Circulars.length <= 1) {
        $this.displayCircular(0, (parseInt(q['p'] || q['pg']) || 1) - 1);
      } else if (q['c']) {
        $this.displayCircular((parseInt(q['c']) || 1) - 1, (parseInt(q['p'] || q['pg']) || 1) - 1)
      }
    },
    displayCircular: function(circularIdx, pageIdx) {
      /// <summary>Display the circular</summary>
      /// <param name="circularIdx" type="Integer">Circular Index</param>
      /// <param name="pageIdx" type="Integer">Page Index</param>

      var $this = this;
      if (typeof (circularIdx) === 'undefined')
        circularIdx = 0;
      if (typeof (pageIdx) === 'undefined')
        pageIdx = 0;

      if (typeof ($this.settings.onCircularDisplaying) === 'function') {
        try {
          if ($this.settings.onCircularDisplaying($this, circularIdx, pageIdx)) {
            return;
          }
        } catch (e) {}
      }

      var el = $($this.element);
      var circ = $this.settings.data.Circulars[circularIdx];
      var circPage = circ.Pages[pageIdx];
      $this.circularIdx = circularIdx;

      // hide multiple circ
      el.find('.dcircular-list').hide();

      // create circular page  
      var htmlCirc = $this._templateCircSingle({
        HasMultipleCircular: $this.settings.data.Circulars.length > 1,
        Circular: circ,
        CircularIndex: circularIdx,
        CurrentPageIndex: (pageIdx + 1),
        Page: circPage
      });
      el.find('.dcircular-single').html(htmlCirc);

      el.find('.dcircular-pager li a').click(function(evt) {
        var $target = $(evt.target);
        var realTarget = $target.parent('a');
        var idx = $target.html();
        if ($target.hasClass('pager-previous') || realTarget.hasClass('pager-previous')) {
          idx = (pageIdx || 0);
          if (idx <= 0) {
            idx = circ.Pages.length;
          }
        } else if ($target.hasClass('pager-next') || realTarget.hasClass('pager-next')) {
          idx = (pageIdx || 0) + 2;
          if (circ.Pages.length < idx) {
            idx = 1;
          }
        }

        $this.displayCircular($this.circularIdx, parseInt(idx) - 1);
        return false;
      });

      function hidePopup() {
        setTimeout(function() {
          $('.qtip').slideUp();
          $('.dcircular-popup').slideUp();
        }, 500);
      }

      function handleSelect(evt) {
        if (typeof ($this.settings.onItemSelect) == 'function') {
          var itemId = $(this).data().circularitemid;
          var item = $this.getCircularItem(itemId);
          if (typeof ($this.settings.onItemSelect) === 'function') {
            $this.settings.onItemSelect($this, evt, item);
          }
        }
        hidePopup();
      }

      var areas = el.find('area').click(handleSelect);

      var popover = $('.dcircular-popup');
      if (popover.length > 0) {
        var myTimeout = undefined;
        areas.mousemove(function(e) {
          var itemId = $(this).data().circularitemid;
          var item = $this.getCircularItem(itemId);
          $('.dcircular-popup .popup-title').html($this._templateCircPopupTitle(item));
          $('.dcircular-popup .popup-content').html($this._templateCircPopup(item));

          // reposition
          var offset = $(this).offset();
          var height = popover.show().height();

          $('.dcircular-popup').css({
            top: e.clientY + 15,
            left: e.clientX - (height / 2)
          }).show();
          if (myTimeout) {
            clearTimeout(myTimeout);
          }
          myTimeout = setTimeout(hidePopup, 1500);
        }).mouseleave(function(e) {
          if (myTimeout) {
            clearTimeout(myTimeout);
          }
          myTimeout = setTimeout(hidePopup, 500);
        });
        popover.mousemove(function(e) {
          if (myTimeout) {
            clearTimeout(myTimeout);
          }
          myTimeout = setTimeout(hidePopup, 1500);
        });
      } else { // fallback with qtip
        areas.qtip({
          content: {
            text: function(evt, api) {
              // Retrieve content from custom attribute of the $('.selector') elements.
              var itemId = $(this).data().circularitemid;
              var item = $this.getCircularItem(itemId);
              return $this._templateCircPopup(item);
            },
            title: function() {
              var itemId = $(this).data().circularitemid;
              var item = $this.getCircularItem(itemId);
              return $this._templateCircPopupTitle(item);
            },
            attr: 'data-ng-non-bindable'
          },
          style: {
            classes: 'qtip-light qtip-rounded'
          },
          position: {
            target: 'mouse',
            adjust: {
              x: 10,
              y: 10
            },
            viewport: $(this.element)
          },
          show: {
            event: 'click mouseover',
            solo: true
          },
          hide: {
            inactive: 15000
          }
        });
      }

      if (typeof ($this.settings.onCircularDisplayed) === 'function') {
        try {
          $this.settings.onCircularDisplayed($this, circularIdx, pageIdx);
        } catch (e) {}
      }
    },
    getCircularItem: function(itemId) {
      /// <summary>Get circular item</summary>
      /// <param name="itemId" type="Integer">Id of item to get</param>

      return this._circularItemById[itemId];
    },
    getCircular: function(circularIdx) {
      if (typeof (circularIdx) === 'undefined')
        circularIdx = 0;
      return this.settings.data.Circulars[circularIdx];
    }
  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
    });
  };

})(jQuery, window, document);
;(function(){"use strict";angular.module("angular-loading-bar",["chieffancypants.loadingBar"]);angular.module("chieffancypants.loadingBar",[]).config(["$httpProvider",function(e){var t=["$q","$cacheFactory","$timeout","$rootScope","cfpLoadingBar",function(t,n,r,i,s){function l(){r.cancel(f);s.complete();u=0;o=0}function c(t){var r;var i=e.defaults;if(t.method!=="GET"||t.cache===false){t.cached=false;return false}if(t.cache===true&&i.cache===undefined){r=n.get("$http")}else if(i.cache!==undefined){r=i.cache}else{r=t.cache}var s=r!==undefined?r.get(t.url)!==undefined:false;if(t.cached!==undefined&&s!==t.cached){return t.cached}t.cached=s;return s}var o=0;var u=0;var a=s.latencyThreshold;var f;return{request:function(e){if(!e.ignoreLoadingBar&&!c(e)){i.$broadcast("cfpLoadingBar:loading",{url:e.url});if(o===0){f=r(function(){s.start()},a)}o++;s.set(u/o)}return e},response:function(e){if(!c(e.config)){u++;i.$broadcast("cfpLoadingBar:loaded",{url:e.config.url});if(u>=o){l()}else{s.set(u/o)}}return e},responseError:function(e){if(!c(e.config)){u++;i.$broadcast("cfpLoadingBar:loaded",{url:e.config.url});if(u>=o){l()}else{s.set(u/o)}}return t.reject(e)}}}];e.interceptors.push(t)}]).provider("cfpLoadingBar",function(){this.includeSpinner=true;this.includeBar=true;this.latencyThreshold=100;this.parentSelector="body";this.$get=["$document","$timeout","$animate","$rootScope",function(e,t,n,r){function v(){t.cancel(l);if(c){return}r.$broadcast("cfpLoadingBar:started");c=true;if(d){n.enter(o,s)}if(p){n.enter(a,s)}m(.02)}function m(e){if(!c){return}var n=e*100+"%";u.css("width",n);h=e;t.cancel(f);f=t(function(){g()},250)}function g(){if(y()>=1){return}var e=0;var t=y();if(t>=0&&t<.25){e=(Math.random()*(5-3+1)+3)/100}else if(t>=.25&&t<.65){e=Math.random()*3/100}else if(t>=.65&&t<.9){e=Math.random()*2/100}else if(t>=.9&&t<.99){e=.005}else{e=0}var n=y()+e;m(n)}function y(){return h}function b(){r.$broadcast("cfpLoadingBar:completed");m(1);l=t(function(){n.leave(o,function(){h=0;c=false});n.leave(a)},500)}var i=this.parentSelector,s=e.find(i),o=angular.element('<div id="loading-bar"><div class="bar"><div class="peg"></div></div></div>'),u=o.find("div").eq(0),a=angular.element('<div id="loading-bar-spinner"><img src="//cdn.brickinc.net/script/images/loading.gif" alt="loading spinner" class="spinner-icon" /></div>');var f,l,c=false,h=0;var p=this.includeSpinner;var d=this.includeBar;return{start:v,set:m,status:y,inc:g,complete:b,includeSpinner:this.includeSpinner,latencyThreshold:this.latencyThreshold,parentSelector:this.parentSelector}}]})})();

/* ng-infinite-scroll - v1.0.0 - 2013-02-23 */
var mod;mod=angular.module("infinite-scroll",[]),mod.directive("infiniteScroll",["$rootScope","$window","$timeout",function(i,n,e){return{link:function(t,l,o){var r,c,f,a;return n=angular.element(n),f=0,null!=o.infiniteScrollDistance&&t.$watch(o.infiniteScrollDistance,function(i){return f=parseInt(i,10)}),a=!0,r=!1,null!=o.infiniteScrollDisabled&&t.$watch(o.infiniteScrollDisabled,function(i){return a=!i,a&&r?(r=!1,c()):void 0}),c=function(){var e,c,u,d;return d=n.height()+n.scrollTop(),e=l.offset().top+l.height(),c=e-d,u=n.height()*f>=c,u&&a?i.$$phase?t.$eval(o.infiniteScroll):t.$apply(o.infiniteScroll):u?r=!0:void 0},n.on("scroll",c),t.$on("$destroy",function(){return n.off("scroll",c)}),e(function(){return o.infiniteScrollImmediateCheck?t.$eval(o.infiniteScrollImmediateCheck)?c():void 0:c()},0)}}}]);
/*! Respond.js v1.4.2: min/max-width media query polyfill * Copyright 2013 Scott Jehl
 * Licensed under https://github.com/scottjehl/Respond/blob/master/LICENSE-MIT
 *  */

!function(a){"use strict";a.matchMedia=a.matchMedia||function(a){var b,c=a.documentElement,d=c.firstElementChild||c.firstChild,e=a.createElement("body"),f=a.createElement("div");return f.id="mq-test-1",f.style.cssText="position:absolute;top:-100em",e.style.background="none",e.appendChild(f),function(a){return f.innerHTML='&shy;<style media="'+a+'"> #mq-test-1 { width: 42px; }</style>',c.insertBefore(e,d),b=42===f.offsetWidth,c.removeChild(e),{matches:b,media:a}}}(a.document)}(this),function(a){"use strict";function b(){u(!0)}var c={};a.respond=c,c.update=function(){};var d=[],e=function(){var b=!1;try{b=new a.XMLHttpRequest}catch(c){b=new a.ActiveXObject("Microsoft.XMLHTTP")}return function(){return b}}(),f=function(a,b){var c=e();c&&(c.open("GET",a,!0),c.onreadystatechange=function(){4!==c.readyState||200!==c.status&&304!==c.status||b(c.responseText)},4!==c.readyState&&c.send(null))};if(c.ajax=f,c.queue=d,c.regex={media:/@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi,keyframes:/@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,urls:/(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,findStyles:/@media *([^\{]+)\{([\S\s]+?)$/,only:/(only\s+)?([a-zA-Z]+)\s?/,minw:/\([\s]*min\-width\s*:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/,maxw:/\([\s]*max\-width\s*:[\s]*([\s]*[0-9\.]+)(px|em)[\s]*\)/},c.mediaQueriesSupported=a.matchMedia&&null!==a.matchMedia("only all")&&a.matchMedia("only all").matches,!c.mediaQueriesSupported){var g,h,i,j=a.document,k=j.documentElement,l=[],m=[],n=[],o={},p=30,q=j.getElementsByTagName("head")[0]||k,r=j.getElementsByTagName("base")[0],s=q.getElementsByTagName("link"),t=function(){var a,b=j.createElement("div"),c=j.body,d=k.style.fontSize,e=c&&c.style.fontSize,f=!1;return b.style.cssText="position:absolute;font-size:1em;width:1em",c||(c=f=j.createElement("body"),c.style.background="none"),k.style.fontSize="100%",c.style.fontSize="100%",c.appendChild(b),f&&k.insertBefore(c,k.firstChild),a=b.offsetWidth,f?k.removeChild(c):c.removeChild(b),k.style.fontSize=d,e&&(c.style.fontSize=e),a=i=parseFloat(a)},u=function(b){var c="clientWidth",d=k[c],e="CSS1Compat"===j.compatMode&&d||j.body[c]||d,f={},o=s[s.length-1],r=(new Date).getTime();if(b&&g&&p>r-g)return a.clearTimeout(h),h=a.setTimeout(u,p),void 0;g=r;for(var v in l)if(l.hasOwnProperty(v)){var w=l[v],x=w.minw,y=w.maxw,z=null===x,A=null===y,B="em";x&&(x=parseFloat(x)*(x.indexOf(B)>-1?i||t():1)),y&&(y=parseFloat(y)*(y.indexOf(B)>-1?i||t():1)),w.hasquery&&(z&&A||!(z||e>=x)||!(A||y>=e))||(f[w.media]||(f[w.media]=[]),f[w.media].push(m[w.rules]))}for(var C in n)n.hasOwnProperty(C)&&n[C]&&n[C].parentNode===q&&q.removeChild(n[C]);n.length=0;for(var D in f)if(f.hasOwnProperty(D)){var E=j.createElement("style"),F=f[D].join("\n");E.type="text/css",E.media=D,q.insertBefore(E,o.nextSibling),E.styleSheet?E.styleSheet.cssText=F:E.appendChild(j.createTextNode(F)),n.push(E)}},v=function(a,b,d){var e=a.replace(c.regex.keyframes,"").match(c.regex.media),f=e&&e.length||0;b=b.substring(0,b.lastIndexOf("/"));var g=function(a){return a.replace(c.regex.urls,"$1"+b+"$2$3")},h=!f&&d;b.length&&(b+="/"),h&&(f=1);for(var i=0;f>i;i++){var j,k,n,o;h?(j=d,m.push(g(a))):(j=e[i].match(c.regex.findStyles)&&RegExp.$1,m.push(RegExp.$2&&g(RegExp.$2))),n=j.split(","),o=n.length;for(var p=0;o>p;p++)k=n[p],l.push({media:k.split("(")[0].match(c.regex.only)&&RegExp.$2||"all",rules:m.length-1,hasquery:k.indexOf("(")>-1,minw:k.match(c.regex.minw)&&parseFloat(RegExp.$1)+(RegExp.$2||""),maxw:k.match(c.regex.maxw)&&parseFloat(RegExp.$1)+(RegExp.$2||"")})}u()},w=function(){if(d.length){var b=d.shift();f(b.href,function(c){v(c,b.href,b.media),o[b.href]=!0,a.setTimeout(function(){w()},0)})}},x=function(){for(var b=0;b<s.length;b++){var c=s[b],e=c.href,f=c.media,g=c.rel&&"stylesheet"===c.rel.toLowerCase();e&&g&&!o[e]&&(c.styleSheet&&c.styleSheet.rawCssText?(v(c.styleSheet.rawCssText,e,f),o[e]=!0):(!/^([a-zA-Z:]*\/\/)/.test(e)&&!r||e.replace(RegExp.$1,"").split("/")[0]===a.location.host)&&("//"===e.substring(0,2)&&(e=a.location.protocol+e),d.push({href:e,media:f})))}w()};x(),c.update=x,c.getEmValue=t,a.addEventListener?a.addEventListener("resize",b,!1):a.attachEvent&&a.attachEvent("onresize",b)}}(this);
// this allow for proxying respondjs ajax requests
// use to proxy content loaded from CDN or CORS support for older browser
// overriding respond.ajax
// load after respond loaded
(function (win, doc, undefined) {
  var baseElem = doc.getElementsByTagName("base")[0];

  function fakejax(url, callback) {
    $.ajax({ url: url }).then(function (response) {
      callback(response);
    });
  }

  function buildUrls() {
    var links = doc.getElementsByTagName("link");

    for (var i = 0, linkl = links.length; i < linkl; i++) {

      var thislink = links[i],
				href = links[i].href,
				extreg = (/^([a-zA-Z:]*\/\/(www\.)?)/).test(href),
				ext = (baseElem && !extreg) || extreg;

      // make sure it's an external stylesheet
      if (thislink.rel.indexOf("stylesheet") >= 0 && ext) {
        (function (link) {
          fakejax(href, function (css) {
            link.styleSheet.rawCssText = css;
            respond.update();
          });
        })(thislink);
      }
    }
  }

  if (!respond.mediaQueriesSupported) {
    buildUrls();
  }

})(window, document, window.jQuery || window.Zepto || window.tire);
/**
 * angular-ui-utils - Swiss-Army-Knife of AngularJS tools (with no external dependencies!)
 * @version v0.1.0 - 2013-12-30
 * @link http://angular-ui.github.com
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
"use strict";angular.module("ui.alias",[]).config(["$compileProvider","uiAliasConfig",function(a,b){b=b||{},angular.forEach(b,function(b,c){angular.isString(b)&&(b={replace:!0,template:b}),a.directive(c,function(){return b})})}]),angular.module("ui.event",[]).directive("uiEvent",["$parse",function(a){return function(b,c,d){var e=b.$eval(d.uiEvent);angular.forEach(e,function(d,e){var f=a(d);c.bind(e,function(a){var c=Array.prototype.slice.call(arguments);c=c.splice(1),f(b,{$event:a,$params:c}),b.$$phase||b.$apply()})})}}]),angular.module("ui.format",[]).filter("format",function(){return function(a,b){var c=a;if(angular.isString(c)&&void 0!==b)if(angular.isArray(b)||angular.isObject(b)||(b=[b]),angular.isArray(b)){var d=b.length,e=function(a,c){return c=parseInt(c,10),c>=0&&d>c?b[c]:a};c=c.replace(/\$([0-9]+)/g,e)}else angular.forEach(b,function(a,b){c=c.split(":"+b).join(a)});return c}}),angular.module("ui.highlight",[]).filter("highlight",function(){return function(a,b,c){return b||angular.isNumber(b)?(a=a.toString(),b=b.toString(),c?a.split(b).join('<span class="ui-match">'+b+"</span>"):a.replace(new RegExp(b,"gi"),'<span class="ui-match">$&</span>')):a}}),angular.module("ui.include",[]).directive("uiInclude",["$http","$templateCache","$anchorScroll","$compile",function(a,b,c,d){return{restrict:"ECA",terminal:!0,compile:function(e,f){var g=f.uiInclude||f.src,h=f.fragment||"",i=f.onload||"",j=f.autoscroll;return function(e,f){function k(){var k=++m,o=e.$eval(g),p=e.$eval(h);o?a.get(o,{cache:b}).success(function(a){if(k===m){l&&l.$destroy(),l=e.$new();var b;b=p?angular.element("<div/>").html(a).find(p):angular.element("<div/>").html(a).contents(),f.html(b),d(b)(l),!angular.isDefined(j)||j&&!e.$eval(j)||c(),l.$emit("$includeContentLoaded"),e.$eval(i)}}).error(function(){k===m&&n()}):n()}var l,m=0,n=function(){l&&(l.$destroy(),l=null),f.html("")};e.$watch(h,k),e.$watch(g,k)}}}}]),angular.module("ui.indeterminate",[]).directive("uiIndeterminate",[function(){return{compile:function(a,b){return b.type&&"checkbox"===b.type.toLowerCase()?function(a,b,c){a.$watch(c.uiIndeterminate,function(a){b[0].indeterminate=!!a})}:angular.noop}}}]),angular.module("ui.inflector",[]).filter("inflector",function(){function a(a){return a.replace(/^([a-z])|\s+([a-z])/g,function(a){return a.toUpperCase()})}function b(a,b){return a.replace(/[A-Z]/g,function(a){return b+a})}var c={humanize:function(c){return a(b(c," ").split("_").join(" "))},underscore:function(a){return a.substr(0,1).toLowerCase()+b(a.substr(1),"_").toLowerCase().split(" ").join("_")},variable:function(b){return b=b.substr(0,1).toLowerCase()+a(b.split("_").join(" ")).substr(1).split(" ").join("")}};return function(a,b){return b!==!1&&angular.isString(a)?(b=b||"humanize",c[b](a)):a}}),angular.module("ui.jq",[]).value("uiJqConfig",{}).directive("uiJq",["uiJqConfig","$timeout",function(a,b){return{restrict:"A",compile:function(c,d){if(!angular.isFunction(c[d.uiJq]))throw new Error('ui-jq: The "'+d.uiJq+'" function does not exist');var e=a&&a[d.uiJq];return function(a,c,d){function f(){b(function(){c[d.uiJq].apply(c,g)},0,!1)}var g=[];d.uiOptions?(g=a.$eval("["+d.uiOptions+"]"),angular.isObject(e)&&angular.isObject(g[0])&&(g[0]=angular.extend({},e,g[0]))):e&&(g=[e]),d.ngModel&&c.is("select,input,textarea")&&c.bind("change",function(){c.trigger("input")}),d.uiRefresh&&a.$watch(d.uiRefresh,function(){f()}),f()}}}}]),angular.module("ui.keypress",[]).factory("keypressHelper",["$parse",function(a){var b={8:"backspace",9:"tab",13:"enter",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"insert",46:"delete"},c=function(a){return a.charAt(0).toUpperCase()+a.slice(1)};return function(d,e,f,g){var h,i=[];h=e.$eval(g["ui"+c(d)]),angular.forEach(h,function(b,c){var d,e;e=a(b),angular.forEach(c.split(" "),function(a){d={expression:e,keys:{}},angular.forEach(a.split("-"),function(a){d.keys[a]=!0}),i.push(d)})}),f.bind(d,function(a){var c=!(!a.metaKey||a.ctrlKey),f=!!a.altKey,g=!!a.ctrlKey,h=!!a.shiftKey,j=a.keyCode;"keypress"===d&&!h&&j>=97&&122>=j&&(j-=32),angular.forEach(i,function(d){var i=d.keys[b[j]]||d.keys[j.toString()],k=!!d.keys.meta,l=!!d.keys.alt,m=!!d.keys.ctrl,n=!!d.keys.shift;i&&k===c&&l===f&&m===g&&n===h&&e.$apply(function(){d.expression(e,{$event:a})})})})}}]),angular.module("ui.keypress").directive("uiKeydown",["keypressHelper",function(a){return{link:function(b,c,d){a("keydown",b,c,d)}}}]),angular.module("ui.keypress").directive("uiKeypress",["keypressHelper",function(a){return{link:function(b,c,d){a("keypress",b,c,d)}}}]),angular.module("ui.keypress").directive("uiKeyup",["keypressHelper",function(a){return{link:function(b,c,d){a("keyup",b,c,d)}}}]),angular.module("ui.mask",[]).value("uiMaskConfig",{maskDefinitions:{9:/\d/,A:/[a-zA-Z]/,"*":/[a-zA-Z0-9]/}}).directive("uiMask",["uiMaskConfig",function(a){return{priority:100,require:"ngModel",restrict:"A",compile:function(){var b=a;return function(a,c,d,e){function f(a){return angular.isDefined(a)?(s(a),N?(k(),l(),!0):j()):j()}function g(a){angular.isDefined(a)&&(D=a,N&&w())}function h(a){return N?(G=o(a||""),I=n(G),e.$setValidity("mask",I),I&&G.length?p(G):void 0):a}function i(a){return N?(G=o(a||""),I=n(G),e.$viewValue=G.length?p(G):"",e.$setValidity("mask",I),""===G&&void 0!==e.$error.required&&e.$setValidity("required",!1),I?G:void 0):a}function j(){return N=!1,m(),angular.isDefined(P)?c.attr("placeholder",P):c.removeAttr("placeholder"),angular.isDefined(Q)?c.attr("maxlength",Q):c.removeAttr("maxlength"),c.val(e.$modelValue),e.$viewValue=e.$modelValue,!1}function k(){G=K=o(e.$modelValue||""),H=J=p(G),I=n(G);var a=I&&G.length?H:"";d.maxlength&&c.attr("maxlength",2*B[B.length-1]),c.attr("placeholder",D),c.val(a),e.$viewValue=a}function l(){O||(c.bind("blur",t),c.bind("mousedown mouseup",u),c.bind("input keyup click focus",w),O=!0)}function m(){O&&(c.unbind("blur",t),c.unbind("mousedown",u),c.unbind("mouseup",u),c.unbind("input",w),c.unbind("keyup",w),c.unbind("click",w),c.unbind("focus",w),O=!1)}function n(a){return a.length?a.length>=F:!0}function o(a){var b="",c=C.slice();return a=a.toString(),angular.forEach(E,function(b){a=a.replace(b,"")}),angular.forEach(a.split(""),function(a){c.length&&c[0].test(a)&&(b+=a,c.shift())}),b}function p(a){var b="",c=B.slice();return angular.forEach(D.split(""),function(d,e){a.length&&e===c[0]?(b+=a.charAt(0)||"_",a=a.substr(1),c.shift()):b+=d}),b}function q(a){var b=d.placeholder;return"undefined"!=typeof b&&b[a]?b[a]:"_"}function r(){return D.replace(/[_]+/g,"_").replace(/([^_]+)([a-zA-Z0-9])([^_])/g,"$1$2_$3").split("_")}function s(a){var b=0;if(B=[],C=[],D="","string"==typeof a){F=0;var c=!1,d=a.split("");angular.forEach(d,function(a,d){R.maskDefinitions[a]?(B.push(b),D+=q(d),C.push(R.maskDefinitions[a]),b++,c||F++):"?"===a?c=!0:(D+=a,b++)})}B.push(B.slice().pop()+1),E=r(),N=B.length>1?!0:!1}function t(){L=0,M=0,I&&0!==G.length||(H="",c.val(""),a.$apply(function(){e.$setViewValue("")}))}function u(a){"mousedown"===a.type?c.bind("mouseout",v):c.unbind("mouseout",v)}function v(){M=A(this),c.unbind("mouseout",v)}function w(b){b=b||{};var d=b.which,f=b.type;if(16!==d&&91!==d){var g,h=c.val(),i=J,j=o(h),k=K,l=!1,m=y(this)||0,n=L||0,q=m-n,r=B[0],s=B[j.length]||B.slice().shift(),t=M||0,u=A(this)>0,v=t>0,w=h.length>i.length||t&&h.length>i.length-t,C=h.length<i.length||t&&h.length===i.length-t,D=d>=37&&40>=d&&b.shiftKey,E=37===d,F=8===d||"keyup"!==f&&C&&-1===q,G=46===d||"keyup"!==f&&C&&0===q&&!v,H=(E||F||"click"===f)&&m>r;if(M=A(this),!D&&(!u||"click"!==f&&"keyup"!==f)){if("input"===f&&C&&!v&&j===k){for(;F&&m>r&&!x(m);)m--;for(;G&&s>m&&-1===B.indexOf(m);)m++;var I=B.indexOf(m);j=j.substring(0,I)+j.substring(I+1),l=!0}for(g=p(j),J=g,K=j,c.val(g),l&&a.$apply(function(){e.$setViewValue(j)}),w&&r>=m&&(m=r+1),H&&m--,m=m>s?s:r>m?r:m;!x(m)&&m>r&&s>m;)m+=H?-1:1;(H&&s>m||w&&!x(n))&&m++,L=m,z(this,m)}}}function x(a){return B.indexOf(a)>-1}function y(a){if(!a)return 0;if(void 0!==a.selectionStart)return a.selectionStart;if(document.selection){a.focus();var b=document.selection.createRange();return b.moveStart("character",-a.value.length),b.text.length}return 0}function z(a,b){if(!a)return 0;if(0!==a.offsetWidth&&0!==a.offsetHeight)if(a.setSelectionRange)a.focus(),a.setSelectionRange(b,b);else if(a.createTextRange){var c=a.createTextRange();c.collapse(!0),c.moveEnd("character",b),c.moveStart("character",b),c.select()}}function A(a){return a?void 0!==a.selectionStart?a.selectionEnd-a.selectionStart:document.selection?document.selection.createRange().text.length:0:0}var B,C,D,E,F,G,H,I,J,K,L,M,N=!1,O=!1,P=d.placeholder,Q=d.maxlength,R={};d.uiOptions?(R=a.$eval("["+d.uiOptions+"]"),angular.isObject(R[0])&&(R=function(a,b){for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]?angular.extend(b[c],a[c]):b[c]=angular.copy(a[c]));return b}(b,R[0]))):R=b,d.$observe("uiMask",f),d.$observe("placeholder",g),e.$formatters.push(h),e.$parsers.push(i),c.bind("mousedown mouseup",u),Array.prototype.indexOf||(Array.prototype.indexOf=function(a){if(null===this)throw new TypeError;var b=Object(this),c=b.length>>>0;if(0===c)return-1;var d=0;if(arguments.length>1&&(d=Number(arguments[1]),d!==d?d=0:0!==d&&1/0!==d&&d!==-1/0&&(d=(d>0||-1)*Math.floor(Math.abs(d)))),d>=c)return-1;for(var e=d>=0?d:Math.max(c-Math.abs(d),0);c>e;e++)if(e in b&&b[e]===a)return e;return-1})}}}}]),angular.module("ui.reset",[]).value("uiResetConfig",null).directive("uiReset",["uiResetConfig",function(a){var b=null;return void 0!==a&&(b=a),{require:"ngModel",link:function(a,c,d,e){var f;f=angular.element('<a class="ui-reset" />'),c.wrap('<span class="ui-resetwrap" />').after(f),f.bind("click",function(c){c.preventDefault(),a.$apply(function(){d.uiReset?e.$setViewValue(a.$eval(d.uiReset)):e.$setViewValue(b),e.$render()})})}}}]),angular.module("ui.route",[]).directive("uiRoute",["$location","$parse",function(a,b){return{restrict:"AC",scope:!0,compile:function(c,d){var e;if(d.uiRoute)e="uiRoute";else if(d.ngHref)e="ngHref";else{if(!d.href)throw new Error("uiRoute missing a route or href property on "+c[0]);e="href"}return function(c,d,f){function g(b){var d=b.indexOf("#");d>-1&&(b=b.substr(d+1)),(j=function(){i(c,a.path().indexOf(b)>-1)})()}function h(b){var d=b.indexOf("#");d>-1&&(b=b.substr(d+1)),(j=function(){var d=new RegExp("^"+b+"$",["i"]);i(c,d.test(a.path()))})()}var i=b(f.ngModel||f.routeModel||"$uiRoute").assign,j=angular.noop;switch(e){case"uiRoute":f.uiRoute?h(f.uiRoute):f.$observe("uiRoute",h);break;case"ngHref":f.ngHref?g(f.ngHref):f.$observe("ngHref",g);break;case"href":g(f.href)}c.$on("$routeChangeSuccess",function(){j()}),c.$on("$stateChangeSuccess",function(){j()})}}}}]),angular.module("ui.scroll.jqlite",["ui.scroll"]).service("jqLiteExtras",["$log","$window",function(a,b){return{registerFor:function(a){var c,d,e,f,g,h,i;return d=angular.element.prototype.css,a.prototype.css=function(a,b){var c,e;return e=this,c=e[0],c&&3!==c.nodeType&&8!==c.nodeType&&c.style?d.call(e,a,b):void 0},h=function(a){return a&&a.document&&a.location&&a.alert&&a.setInterval},i=function(a,b,c){var d,e,f,g,i;return d=a[0],i={top:["scrollTop","pageYOffset","scrollLeft"],left:["scrollLeft","pageXOffset","scrollTop"]}[b],e=i[0],g=i[1],f=i[2],h(d)?angular.isDefined(c)?d.scrollTo(a[f].call(a),c):g in d?d[g]:d.document.documentElement[e]:angular.isDefined(c)?d[e]=c:d[e]},b.getComputedStyle?(f=function(a){return b.getComputedStyle(a,null)},c=function(a,b){return parseFloat(b)}):(f=function(a){return a.currentStyle},c=function(a,b){var c,d,e,f,g,h,i;return c=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,f=new RegExp("^("+c+")(?!px)[a-z%]+$","i"),f.test(b)?(i=a.style,d=i.left,g=a.runtimeStyle,h=g&&g.left,g&&(g.left=i.left),i.left=b,e=i.pixelLeft,i.left=d,h&&(g.left=h),e):parseFloat(b)}),e=function(a,b){var d,e,g,i,j,k,l,m,n,o,p,q,r;return h(a)?(d=document.documentElement[{height:"clientHeight",width:"clientWidth"}[b]],{base:d,padding:0,border:0,margin:0}):(r={width:[a.offsetWidth,"Left","Right"],height:[a.offsetHeight,"Top","Bottom"]}[b],d=r[0],l=r[1],m=r[2],k=f(a),p=c(a,k["padding"+l])||0,q=c(a,k["padding"+m])||0,e=c(a,k["border"+l+"Width"])||0,g=c(a,k["border"+m+"Width"])||0,i=k["margin"+l],j=k["margin"+m],n=c(a,i)||0,o=c(a,j)||0,{base:d,padding:p+q,border:e+g,margin:n+o})},g=function(a,b,c){var d,g,h;return g=e(a,b),g.base>0?{base:g.base-g.padding-g.border,outer:g.base,outerfull:g.base+g.margin}[c]:(d=f(a),h=d[b],(0>h||null===h)&&(h=a.style[b]||0),h=parseFloat(h)||0,{base:h-g.padding-g.border,outer:h,outerfull:h+g.padding+g.border+g.margin}[c])},angular.forEach({before:function(a){var b,c,d,e,f,g,h;if(f=this,c=f[0],e=f.parent(),b=e.contents(),b[0]===c)return e.prepend(a);for(d=g=1,h=b.length-1;h>=1?h>=g:g>=h;d=h>=1?++g:--g)if(b[d]===c)return angular.element(b[d-1]).after(a),void 0;throw new Error("invalid DOM structure "+c.outerHTML)},height:function(a){var b;return b=this,angular.isDefined(a)?(angular.isNumber(a)&&(a+="px"),d.call(b,"height",a)):g(this[0],"height","base")},outerHeight:function(a){return g(this[0],"height",a?"outerfull":"outer")},offset:function(a){var b,c,d,e,f,g;return f=this,arguments.length?void 0===a?f:a:(b={top:0,left:0},e=f[0],(c=e&&e.ownerDocument)?(d=c.documentElement,e.getBoundingClientRect&&(b=e.getBoundingClientRect()),g=c.defaultView||c.parentWindow,{top:b.top+(g.pageYOffset||d.scrollTop)-(d.clientTop||0),left:b.left+(g.pageXOffset||d.scrollLeft)-(d.clientLeft||0)}):void 0)},scrollTop:function(a){return i(this,"top",a)},scrollLeft:function(a){return i(this,"left",a)}},function(b,c){return a.prototype[c]?void 0:a.prototype[c]=b})}}}]).run(["$log","$window","jqLiteExtras",function(a,b,c){return b.jQuery?void 0:c.registerFor(angular.element)}]),angular.module("ui.scroll",[]).directive("ngScrollViewport",["$log",function(){return{controller:["$scope","$element",function(a,b){return b}]}}]).directive("ngScroll",["$log","$injector","$rootScope","$timeout",function(a,b,c,d){return{require:["?^ngScrollViewport"],transclude:"element",priority:1e3,terminal:!0,compile:function(e,f,g){return function(f,h,i,j){var k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T;if(H=i.ngScroll.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/),!H)throw new Error('Expected ngScroll in form of "item_ in _datasource_" but got "'+i.ngScroll+'"');if(F=H[1],v=H[2],D=function(a){return angular.isObject(a)&&a.get&&angular.isFunction(a.get)},u=f[v],!D(u)&&(u=b.get(v),!D(u)))throw new Error(v+" is not a valid datasource");return r=Math.max(3,+i.bufferSize||10),q=function(){return T.height()*Math.max(.1,+i.padding||.1)},O=function(a){return a[0].scrollHeight||a[0].document.documentElement.scrollHeight},k=null,g(R=f.$new(),function(a){var b,c,d,f,g,h;if(f=a[0].localName,"dl"===f)throw new Error("ng-scroll directive does not support <"+a[0].localName+"> as a repeating tag: "+a[0].outerHTML);return"li"!==f&&"tr"!==f&&(f="div"),h=j[0]||angular.element(window),h.css({"overflow-y":"auto",display:"block"}),d=function(a){var b,c,d;switch(a){case"tr":return d=angular.element("<table><tr><td><div></div></td></tr></table>"),b=d.find("div"),c=d.find("tr"),c.paddingHeight=function(){return b.height.apply(b,arguments)},c;default:return c=angular.element("<"+a+"></"+a+">"),c.paddingHeight=c.height,c}},c=function(a,b,c){return b[{top:"before",bottom:"after"}[c]](a),{paddingHeight:function(){return a.paddingHeight.apply(a,arguments)},insert:function(b){return a[{top:"after",bottom:"before"}[c]](b)}}},g=c(d(f),e,"top"),b=c(d(f),e,"bottom"),R.$destroy(),k={viewport:h,topPadding:g.paddingHeight,bottomPadding:b.paddingHeight,append:b.insert,prepend:g.insert,bottomDataPos:function(){return O(h)-b.paddingHeight()},topDataPos:function(){return g.paddingHeight()}}}),T=k.viewport,B=1,I=1,p=[],J=[],x=!1,n=!1,G=u.loading||function(){},E=!1,L=function(a,b){var c,d;for(c=d=a;b>=a?b>d:d>b;c=b>=a?++d:--d)p[c].scope.$destroy(),p[c].element.remove();return p.splice(a,b-a)},K=function(){return B=1,I=1,L(0,p.length),k.topPadding(0),k.bottomPadding(0),J=[],x=!1,n=!1,l(!1)},o=function(){return T.scrollTop()+T.height()},S=function(){return T.scrollTop()},P=function(){return!x&&k.bottomDataPos()<o()+q()},s=function(){var b,c,d,e,f,g;for(b=0,e=0,c=f=g=p.length-1;(0>=g?0>=f:f>=0)&&(d=p[c].element.outerHeight(!0),k.bottomDataPos()-b-d>o()+q());c=0>=g?++f:--f)b+=d,e++,x=!1;return e>0?(k.bottomPadding(k.bottomPadding()+b),L(p.length-e,p.length),I-=e,a.log("clipped off bottom "+e+" bottom padding "+k.bottomPadding())):void 0},Q=function(){return!n&&k.topDataPos()>S()-q()},t=function(){var b,c,d,e,f,g;for(e=0,d=0,f=0,g=p.length;g>f&&(b=p[f],c=b.element.outerHeight(!0),k.topDataPos()+e+c<S()-q());f++)e+=c,d++,n=!1;return d>0?(k.topPadding(k.topPadding()+e),L(0,d),B+=d,a.log("clipped off top "+d+" top padding "+k.topPadding())):void 0},w=function(a,b){return E||(E=!0,G(!0)),1===J.push(a)?z(b):void 0},C=function(a,b){var c,d,e;return c=f.$new(),c[F]=b,d=a>B,c.$index=a,d&&c.$index--,e={scope:c},g(c,function(b){return e.element=b,d?a===I?(k.append(b),p.push(e)):(p[a-B].element.after(b),p.splice(a-B+1,0,e)):(k.prepend(b),p.unshift(e))}),{appended:d,wrapper:e}},m=function(a,b){var c;return a?k.bottomPadding(Math.max(0,k.bottomPadding()-b.element.outerHeight(!0))):(c=k.topPadding()-b.element.outerHeight(!0),c>=0?k.topPadding(c):T.scrollTop(T.scrollTop()+b.element.outerHeight(!0)))},l=function(b,c,e){var f;return f=function(){return a.log("top {actual="+k.topDataPos()+" visible from="+S()+" bottom {visible through="+o()+" actual="+k.bottomDataPos()+"}"),P()?w(!0,b):Q()&&w(!1,b),e?e():void 0},c?d(function(){var a,b,d;for(b=0,d=c.length;d>b;b++)a=c[b],m(a.appended,a.wrapper);return f()}):f()},A=function(a,b){return l(a,b,function(){return J.shift(),0===J.length?(E=!1,G(!1)):z(a)})},z=function(b){var c;return c=J[0],c?p.length&&!P()?A(b):u.get(I,r,function(c){var d,e,f,g;if(e=[],0===c.length)x=!0,k.bottomPadding(0),a.log("appended: requested "+r+" records starting from "+I+" recieved: eof");else{for(t(),f=0,g=c.length;g>f;f++)d=c[f],e.push(C(++I,d));a.log("appended: requested "+r+" received "+c.length+" buffer size "+p.length+" first "+B+" next "+I)}return A(b,e)}):p.length&&!Q()?A(b):u.get(B-r,r,function(c){var d,e,f,g;if(e=[],0===c.length)n=!0,k.topPadding(0),a.log("prepended: requested "+r+" records starting from "+(B-r)+" recieved: bof");else{for(s(),d=f=g=c.length-1;0>=g?0>=f:f>=0;d=0>=g?++f:--f)e.unshift(C(--B,c[d]));a.log("prepended: requested "+r+" received "+c.length+" buffer size "+p.length+" first "+B+" next "+I)}return A(b,e)})},M=function(){return c.$$phase||E?void 0:(l(!1),f.$apply())},T.bind("resize",M),N=function(){return c.$$phase||E?void 0:(l(!0),f.$apply())},T.bind("scroll",N),f.$watch(u.revision,function(){return K()}),y=u.scope?u.scope.$new():f.$new(),f.$on("$destroy",function(){return y.$destroy(),T.unbind("resize",M),T.unbind("scroll",N)}),y.$on("update.items",function(a,b,c){var d,e,f,g,h;if(angular.isFunction(b))for(e=function(a){return b(a.scope)},f=0,g=p.length;g>f;f++)d=p[f],e(d);else 0<=(h=b-B-1)&&h<p.length&&(p[b-B-1].scope[F]=c);return null}),y.$on("delete.items",function(a,b){var c,d,e,f,g,h,i,j,k,m,n,o;if(angular.isFunction(b)){for(e=[],h=0,k=p.length;k>h;h++)d=p[h],e.unshift(d);for(g=function(a){return b(a.scope)?(L(e.length-1-c,e.length-c),I--):void 0},c=i=0,m=e.length;m>i;c=++i)f=e[c],g(f)}else 0<=(o=b-B-1)&&o<p.length&&(L(b-B-1,b-B),I--);for(c=j=0,n=p.length;n>j;c=++j)d=p[c],d.scope.$index=B+c;return l(!1)}),y.$on("insert.item",function(a,b,c){var d,e,f,g,h,i,j,k,m,n,o,q;if(e=[],angular.isFunction(b)){for(f=[],i=0,m=p.length;m>i;i++)c=p[i],f.unshift(c);for(h=function(a){var f,g,h,i,j;if(g=b(a.scope)){if(C=function(a,b){return C(a,b),I++},angular.isArray(g)){for(j=[],f=h=0,i=g.length;i>h;f=++h)c=g[f],j.push(e.push(C(d+f,c)));return j}return e.push(C(d,g))}},d=j=0,n=f.length;n>j;d=++j)g=f[d],h(g)}else 0<=(q=b-B-1)&&q<p.length&&(e.push(C(b,c)),I++);for(d=k=0,o=p.length;o>k;d=++k)c=p[d],c.scope.$index=B+d;return l(!1,e)})}}}}]),angular.module("ui.scrollfix",[]).directive("uiScrollfix",["$window",function(a){return{require:"^?uiScrollfixTarget",link:function(b,c,d,e){function f(){var b;if(angular.isDefined(a.pageYOffset))b=a.pageYOffset;else{var e=document.compatMode&&"BackCompat"!==document.compatMode?document.documentElement:document.body;b=e.scrollTop}!c.hasClass("ui-scrollfix")&&b>d.uiScrollfix?c.addClass("ui-scrollfix"):c.hasClass("ui-scrollfix")&&b<d.uiScrollfix&&c.removeClass("ui-scrollfix")}var g=c[0].offsetTop,h=e&&e.$element||angular.element(a);d.uiScrollfix?"string"==typeof d.uiScrollfix&&("-"===d.uiScrollfix.charAt(0)?d.uiScrollfix=g-parseFloat(d.uiScrollfix.substr(1)):"+"===d.uiScrollfix.charAt(0)&&(d.uiScrollfix=g+parseFloat(d.uiScrollfix.substr(1)))):d.uiScrollfix=g,h.on("scroll",f),b.$on("$destroy",function(){h.off("scroll",f)})}}}]).directive("uiScrollfixTarget",[function(){return{controller:["$element",function(a){this.$element=a}]}}]),angular.module("ui.showhide",[]).directive("uiShow",[function(){return function(a,b,c){a.$watch(c.uiShow,function(a){a?b.addClass("ui-show"):b.removeClass("ui-show")})}}]).directive("uiHide",[function(){return function(a,b,c){a.$watch(c.uiHide,function(a){a?b.addClass("ui-hide"):b.removeClass("ui-hide")})}}]).directive("uiToggle",[function(){return function(a,b,c){a.$watch(c.uiToggle,function(a){a?b.removeClass("ui-hide").addClass("ui-show"):b.removeClass("ui-show").addClass("ui-hide")})}}]),angular.module("ui.unique",[]).filter("unique",["$parse",function(a){return function(b,c){if(c===!1)return b;if((c||angular.isUndefined(c))&&angular.isArray(b)){var d=[],e=angular.isString(c)?a(c):function(a){return a},f=function(a){return angular.isObject(a)?e(a):a};angular.forEach(b,function(a){for(var b=!1,c=0;c<d.length;c++)if(angular.equals(f(d[c]),f(a))){b=!0;break}b||d.push(a)}),b=d}return b}}]),angular.module("ui.validate",[]).directive("uiValidate",function(){return{restrict:"A",require:"ngModel",link:function(a,b,c,d){function e(b){return angular.isString(b)?(a.$watch(b,function(){angular.forEach(g,function(a){a(d.$modelValue)})}),void 0):angular.isArray(b)?(angular.forEach(b,function(b){a.$watch(b,function(){angular.forEach(g,function(a){a(d.$modelValue)})})}),void 0):(angular.isObject(b)&&angular.forEach(b,function(b,c){angular.isString(b)&&a.$watch(b,function(){g[c](d.$modelValue)}),angular.isArray(b)&&angular.forEach(b,function(b){a.$watch(b,function(){g[c](d.$modelValue)})})}),void 0)}var f,g={},h=a.$eval(c.uiValidate);h&&(angular.isString(h)&&(h={validator:h}),angular.forEach(h,function(b,c){f=function(e){var f=a.$eval(b,{$value:e});return angular.isObject(f)&&angular.isFunction(f.then)?(f.then(function(){d.$setValidity(c,!0)},function(){d.$setValidity(c,!1)}),e):f?(d.$setValidity(c,!0),e):(d.$setValidity(c,!1),void 0)},g[c]=f,d.$formatters.push(f),d.$parsers.push(f)}),c.uiValidateWatch&&e(a.$eval(c.uiValidateWatch)))}}}),angular.module("ui.utils",["ui.event","ui.format","ui.highlight","ui.include","ui.indeterminate","ui.inflector","ui.jq","ui.keypress","ui.mask","ui.reset","ui.route","ui.scrollfix","ui.scroll","ui.scroll.jqlite","ui.showhide","ui.unique","ui.validate"]);
// bridging between Digital Store, ExpressLane, and Advertisment
(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnAdvertising';
  angular.module('gsn.core').service(serviceId, ['$timeout', '$location', 'gsnProfile', 'gsnApi', '$window', gsnAdvertising]);

  function gsnAdvertising($timeout, $location, gsnProfile, gsnApi, $window) {
    var returnObj = {};
    var bricktag = $window.bricktag;
    
    if (!bricktag)
      return returnObj;

    bricktag.on('clickRecipe', function (data) {
      $timeout(function () {
        $location.url('/recipe/' + data.detail.RecipeId);
      });
    });

    bricktag.on('clickProduct', function (data) {
      $timeout(function () {
        var product = data.detail;
        if (product) {
          var item = {
            Quantity: gsnApi.isNaN(parseInt(product.Quantity), 1),
            ItemTypeId: 7,
            Description: gsnApi.isNull(product.Description, '').replace(/^\s+/gi, ''),
            CategoryId: product.CategoryId,
            BrandName: product.BrandName,
            AdCode: product.AdCode
          };

          gsnProfile.addItem(item);
        }
      });
    });

    bricktag.on('clickLink', function (data) {
      $timeout(function () {
        var linkData = data.detail;
        if (linkData) {
          var url = gsnApi.isNull(linkData.Url, '');
          var target = gsnApi.isNull(linkData.Target, '');
          if (target == '_blank') {
            // this is a link out to open in new window
            // $window.open(url, '');
            // commented out because it is not possible to open with interaction
            // it must be done on the ads itself
          } else {
            // assume this is an internal redirect
            if (url.indexOf('/') < 0) {
              url = "/" + url;
            }
            
            $location.url(url);
          }
        }
      });
    });

    return returnObj;
  }
})(angular);
// for handling everything globally
(function(angular, undefined) {
    'use strict';
    var serviceId = 'gsnGlobal';
    angular.module('gsn.core').service(serviceId, ['$window', '$location', '$timeout', '$route', 'gsnApi', 'gsnProfile', 'gsnStore', '$rootScope', 'Facebook', '$analytics', 'gsnYoutech', 'gsnAdvertising', '$anchorScroll', gsnGlobal]);

    function gsnGlobal($window, $location, $timeout, $route, gsnApi, gsnProfile, gsnStore, $rootScope, Facebook, $analytics, gsnYoutech, gsnAdvertising, $anchorScroll) {
        var returnObj = {
            init: init,
            hasInit: false
        };
        return returnObj;

        function init(initProfile, $scope) {
            // prevent mulitple init
            if (returnObj.hasInit) {
                return returnObj;
            }
            returnObj.hasInit = true;
            if (initProfile) {
                gsnProfile.initialize();
            }
            gsnApi.gsn.$rootScope = $rootScope
            $scope = $scope || $rootScope;
            $scope.defaultLayout = gsnApi.getDefaultLayout(gsnApi.getThemeUrl('/views/layout.html'));
            $scope.currentLayout = $scope.defaultLayout;
            $scope.currentPath = '/';
            $scope.notFoundDefaultLayout = gsnApi.getThemeUrl('/views/404.html');
            $scope.notFoundLayout = $scope.notFoundDefaultLayout;
            $scope.gvm = {
                loginCounter: 0,
                menuInactive: false,
                shoppingListActive: false,
                profile: {},
                noCircular: true,
                reloadOnStoreSelection: false,
                currentStore: {},
                adsCollapsed: false
            };
            $scope.youtech = gsnYoutech;
            $scope.search = {
                site: '',
                item: ''
            };
            $scope.facebookReady = false;
            $scope.currentYear = new Date().getFullYear();
            $scope.facebookData = {};
            $scope.hasJustLoggedIn = false;
            $scope.loggedInWithFacebook = false;
            $scope.ChainName = gsnApi.getChainName();
            $scope.isLoggedIn = gsnApi.isLoggedIn();
            $scope.reload = gsnApi.reload;
            $scope.broadcastEvent = $rootScope.$broadcast;
            $scope.goUrl = gsnApi.goUrl;
            $scope.encodeURIComponent = encodeURIComponent;
            $scope.isOnList = gsnProfile.isOnList;
            $scope.getShoppingListCount = gsnProfile.getShoppingListCount;
            $scope.$win = $window;
            $scope.seo = {};
            // $scope._tk = $window._tk;
            $scope.newDate = function(dateArg1) {
              return dateArg1 ? new Date(dateArg1) : new Date();
            };
            $scope.validateRegistration = function(rsp) {
                // attempt to authenticate user with facebook
                // get token
                $scope.facebookData.accessToken = rsp.authResponse.accessToken;
                // get email
                Facebook.api('/me?fields=id,name,email', function(response) {
                    $scope.facebookData.user = response;
                    if (response.email) {
                        // if user is already logged in, don't do it again
                        if (gsnApi.isLoggedIn()) return;
                        // attempt to authenticate
                        gsnProfile.loginFacebook(response.email, $scope.facebookData.accessToken);
                    }
                });
            };
            $scope.doFacebookLogin = function() {
                Facebook.getLoginStatus(function(response) {
                    if (response.status == 'connected' && response.authResponse.accessToken) {
                        $scope.validateRegistration(response);
                    } else {
                        Facebook.login(function(rsp) {
                            if (rsp.authResponse) {
                                $scope.validateRegistration(rsp);
                            }
                        }, {
                            scope: gsnApi.getFacebookPermission()
                        });
                    }
                });
            };
            $scope.doIfLoggedIn = function(callbackFunc) {
                if ($scope.isLoggedIn) {
                    callbackFunc();
                } else {
                    $scope.gvm.loginCounter++;
                }
            };
            $scope.clearSelection = gsnApi.clearSelection;
            $scope.getBindableItem = gsnApi.getBindableItem;
            $scope.updateBindableItem = gsnApi.getBindableItem;
            $scope.doSiteSearch = function() {
                $scope.goUrl('/search?q=' + encodeURIComponent($scope.search.site));
            };
            $scope.doItemSearch = function() {
                $scope.goUrl('/product/search?q=' + encodeURIComponent($scope.search.item));
            };
            $scope.getPageCount = gsnApi.getPageCount;
            $scope.getFullPath = gsnApi.getFullPath;
            $scope.decodeServerUrl = gsnApi.decodeServerUrl;
            $scope.goBack = function() {
                /// <summary>Cause browser to go back.</summary>
                if ($scope.currentPath != '/') {
                    gsnApi.goBack();
                }
            };
            $scope.logout = function() {
                gsnProfile.logOut();
                $scope.isLoggedIn = gsnApi.isLoggedIn();
                if ($scope.loggedInWithFacebook) {
                    $scope.loggedInWithFacebook = false;
                    Facebook.logout();
                }
                // allow time to logout
                $timeout(function() {
                    // reload the page to refresh page status on logout
                    if ($scope.currentPath == '/') {
                        gsnApi.reload();
                    } else {
                        $scope.goUrl('/');
                    }
                }, 500);
            };
            $scope.logoutWithPrompt = function() {
                try {
                    $scope.goOutPrompt(null, '/', $scope.logout, true);
                } catch (e) {
                    $scope.logout();
                }
            };
            $scope.logoutWithPromt = $scope.logoutWithPrompt;
            $scope.goOutPromt = $scope.goOutPrompt;
            $scope.print = function(timeout) {
                setTimeout($window.print, timeout || 5000);
            }
            $scope.getTitle = function() {
                return angular.element('title').text();
            }
            $scope.getSharePath = function(params) {
                var query = $location.search();
                params = params || {};
                angular.copy(query, params);
                return gsnApi.getFullPath($scope.currentPath + '?' + gsnApi.params(params));
            }
            $scope.doToggleCartItem = function(evt, item, linkedItem) {
                /// <summary>Toggle the shoping list item checked state</summary>
                /// <param name="evt" type="Object">for passing in angular $event</param>
                /// <param name="item" type="Object">shopping list item</param>
                if (item.ItemTypeId == 3) {
                    item.Quantity = gsnApi.isNaN(parseInt(item.SalePriceMultiple || item.PriceMultiple || 1), 1);
                }
                if (gsnProfile.isOnList(item)) {
                    gsnProfile.removeItem(item);
                } else {
                    if (linkedItem) {
                        item.OldQuantity = item.Quantity;
                        item.Quantity = linkedItem.NewQuantity;
                    }
                    gsnProfile.addItem(item);
                    if (item.ItemTypeId == 8) {
                        if (gsnApi.isNull(item.Varieties, null) === null) {
                            item.Varieties = [];
                        }
                        $scope.gvm.selectedItem = item;
                    }
                }
                $rootScope.$broadcast('gsnevent:shoppinglist-toggle-item', item);
            };
            $scope.$on('$routeChangeSuccess', function(evt, next, current) {
                if (typeof gmodal !== 'undefined') {
                    $timeout(function() {
                        gmodal.hide();
                    }, 50);
                }
                if ($location.hash()) {
                    $timeout(function() {
                        $anchorScroll();
                    }, 1000);
                }
            });
            // events handling
            $scope.$on('$locationChangeStart', function(evt, nxt, current) {
                /// <summary>Listen to location change</summary>
                /// <param name="evt" type="Object">Event object</param>
                /// <param name="nxt" type="String">next location</param>
                /// <param name="current" type="String">current location</param>
                var next = $route.routes[$location.path()];
                if (!next) next = {};
                // store the new route location
                $scope.seo = next.seo || {};
                $scope.currentPath = angular.lowercase(gsnApi.isNull($location.path(), ''));
                $scope.friendlyPath = $scope.currentPath.replace('/', '').replace(/\/+/gi, '-');
                $scope.gvm.search = $location.search();
                $scope.gvm.menuInactive = false;
                $scope.gvm.shoppingListActive = false;
                if (next.requireLogin && !$scope.isLoggedIn) {
                    evt.preventDefault();
                    $scope.goUrl('/signin?fromUrl=' + encodeURIComponent($location.url()));
                    return;
                }
                // handle storeRequired attribute
                if (next.storeRequired) {
                    if (gsnApi.isNull(gsnApi.getSelectedStoreId(), 0) <= 0) {
                        $scope.goUrl('/storelocator?fromUrl=' + encodeURIComponent($location.url()));
                        return;
                    }
                }

                $scope.currentLayout = $scope.defaultLayout;
                if (gsnApi.isNull(next.layout, '').length > 0) {
                    $scope.currentLayout = next.layout;
                }

                $scope.notFoundLayout = $scope.notFoundDefaultLayout;
                if (gsnApi.isNull(next.notFoundLayout, '').length > 0) {
                    $scope.notFoundLayout = next.notFoundLayout;
                }

                $scope.gvm.selectedItem = null;
            });
            $scope.$on('gsnevent:profile-load-success', function(event, result) {
                if (result.success) {
                    $scope.hasJustLoggedIn = false;
                    gsnProfile.getProfile().then(function(rst) {
                        if (rst.success) {
                            $scope.gvm.profile = rst.response;
                        }
                    });
                }
            });
            $scope.$on('gsnevent:login-success', function(event, result) {
                $scope.isLoggedIn = gsnApi.isLoggedIn();
                $analytics.eventTrack('SigninSuccess', {
                    category: result.payload.grant_type,
                    label: result.response.user_id
                });
                $scope.hasJustLoggedIn = true;
                $scope.loggedInWithFacebook = (result.payload.grant_type == 'facebook');
            });
            $scope.$on('gsnevent:login-failed', function(event, result) {
                if (result.payload.grant_type == 'facebook') {
                    if (gsnApi.isLoggedIn()) return;
                    $scope.goUrl('/registration/facebook');
                    $analytics.eventTrack('SigninFailed', {
                        category: result.payload.grant_type,
                        label: gsnApi.getProfileId()
                    });
                }
            });
            $scope.$on('gsnevent:store-setid', function(event, result) {
                gsnStore.getStore().then(function(store) {
                    $analytics.eventTrack('StoreSelected', {
                        category: store.StoreName,
                        label: store.StoreNumber + ''
                    });
                    $scope.gvm.currentStore = store;
                    gsnProfile.getProfile().then(function(rst) {
                        if (rst.success) {
                            if (rst.response.PrimaryStoreId != store.StoreId) {
                                // save selected store
                                gsnProfile.selectStore(store.StoreId).then(function() {
                                    // broadcast persisted on server response
                                    $rootScope.$broadcast('gsnevent:store-persisted', store);
                                });
                            }
                        }
                    });
                });
            });
            $scope.$on('gsnevent:circular-loading', function(event, data) {
                $scope.gvm.noCircular = true;
            });
            $scope.$on('gsnevent:circular-loaded', function(event, data) {
                $scope.gvm.noCircular = !data.success;
            });
            // trigger facebook init if there is appId
            if (typeof(Facebook.isReady) !== 'undefined' && gsnApi.getConfig().FacebookAppId) {
                $scope.$watch(function() {
                    return Facebook.isReady(); // This is for convenience, to notify if Facebook is loaded and ready to go.
                }, function(newVal) {
                    $scope.facebookReady = true; // You might want to use this to disable/show/hide buttons and else
                    if (gsnApi.isLoggedIn()) return;
                    // attempt to auto login facebook user
                    Facebook.getLoginStatus(function(response) {
                        // only auto login for connected status
                        if (response.status == 'connected') {
                            $scope.validateRegistration(response);
                        }
                    });
                });
            }
            $scope.$on('gsnevent:closemodal', function() {
                if (typeof gmodal !== 'undefined') {
                    gmodal.hide();
                }
            });
            //#region analytics
            $scope.$on('gsnevent:shoppinglistitem-updating', function(event, shoppingList, item) {
                var currentListId = gsnApi.getShoppingListId();
                if (shoppingList.ShoppingListId == currentListId) {
                    try {
                        var cat = gsnStore.getCategories()[item.CategoryId];
                        var evt = 'MiscItemAddUpdate';
                        if (item.ItemTypeId == 8) {
                            evt = 'CircularItemAddUpdate';
                        } else if (item.ItemTypeId == 2) {
                            evt = 'ManufacturerCouponAddUpdate';
                        } else if (item.ItemTypeId == 3) {
                            evt = 'ProductAddUpdate';
                        } else if (item.ItemTypeId == 5) {
                            evt = 'RecipeIngredientAddUpdate';
                        } else if (item.ItemTypeId == 6) {
                            evt = 'OwnItemAddUpdate';
                        } else if (item.ItemTypeId == 10) {
                            evt = 'StoreCouponAddUpdate';
                        } else if (item.ItemTypeId == 13) {
                            evt = 'YoutechCouponAddUpdate';
                        }
                        $analytics.eventTrack(evt, {
                            category: (item.ItemTypeId == 13) ? item.ExtCategory : cat.CategoryName,
                            label: item.Description,
                            item: item
                        });
                    } catch (e) {}
                }
            });
            $scope.$on('gsnevent:shoppinglistitem-removing', function(event, shoppingList, item) {
                var currentListId = gsnApi.getShoppingListId();
                if (shoppingList.ShoppingListId == currentListId) {
                    try {
                        var cat = gsnStore.getCategories()[item.CategoryId],
                            coupon = null,
                            itemId = item.ItemId;
                        if (item.ItemTypeId == 8) {
                            $analytics.eventTrack('CircularItemRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 2) {
                            coupon = gsnStore.getCoupon(item.ItemId, 2);
                            if (coupon) {
                                item = coupon;
                                if (gsnApi.isNull(item.ProductCode, '').length > 0) {
                                    itemId = item.ProductCode;
                                }
                            }
                            $analytics.eventTrack('ManufacturerCouponRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 3) {
                            $analytics.eventTrack('ProductRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 5) {
                            $analytics.eventTrack('RecipeIngredientRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 6) {
                            $analytics.eventTrack('OwnItemRemove', {
                                label: item.Description
                            });
                        } else if (item.ItemTypeId == 10) {
                            coupon = gsnStore.getCoupon(item.ItemId, 10);
                            if (coupon) {
                                item = coupon;
                                if (gsnApi.isNull(item.ProductCode, '').length > 0) {
                                    itemId = item.ProductCode;
                                }
                            }
                            $analytics.eventTrack('StoreCouponRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        } else if (item.ItemTypeId == 13) {
                            coupon = gsnStore.getCoupon(item.ItemId, 13);
                            if (coupon) {
                                item = coupon;
                                if (gsnApi.isNull(item.ProductCode, '').length > 0) {
                                    itemId = item.ProductCode;
                                }
                            }
                            $analytics.eventTrack('YoutechCouponRemove', {
                                category: item.ExtCategory,
                                label: item.Description,
                                item: item
                            });
                        } else {
                            $analytics.eventTrack('MiscItemRemove', {
                                category: cat.CategoryName,
                                label: item.Description,
                                item: item
                            });
                        }
                    } catch (e) {}
                }
            });

            function gsnModalTracking(evt, el, track) {
                var actionName = evt.name.replace("gsnevent:", "-")
                if (track) {
                    $analytics.eventTrack(gsnApi.isNull(track.action, '') + actionName, track);
                    if (track.timedload) {
                        // trigger load ads event
                        $timeout(function() {
                            $rootScope.$broadcast('gsnevent:loadads');
                        }, parseInt(track.timedload));
                    }
                }
            }
            $scope.$on('gsnevent:gsnmodal-hide', gsnModalTracking);
            $scope.$on('gsnevent:gsnmodal-show', gsnModalTracking);
            //#endregion
        } // init
    }
})(angular);

(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnList';
  angular.module('gsn.core').factory(serviceId, ['$rootScope', '$http', 'gsnApi', '$q', '$sessionStorage', gsnList]);

  function gsnList($rootScope, $http, gsnApi, $q, $sessionStorage) {

    var betterStorage = $sessionStorage;

    // just a shopping list object
    function myShoppingList(shoppingListId, shoppingList) {
      var returnObj = { ShoppingListId: shoppingListId };
      var $mySavedData = { list: shoppingList, items: {}, hasLoaded: false, countCache: 0, itemIdentity: 1 };

      returnObj.getItemKey = function (item) {
        var itemKey = item.ItemTypeId;
        if (item.ItemTypeId == 7 || item.AdCode) {
          itemKey = item.AdCode + gsnApi.isNull(item.BrandName, '') + gsnApi.isNull(item.Description, '');
        }

        return itemKey + '_' + item.ItemId;
      };

      // replace local item with server item
      function processServerItem(serverItem, localItem) {
        if (serverItem) {
          var itemKey = returnObj.getItemKey(localItem);

          // set new server item order
          serverItem.Order = localItem.Order;

          // remove existing item locally if new id has been detected
          if (serverItem.ItemId != localItem.ItemId){
            returnObj.removeItem(localItem, true);
          }

          // Add the new server item.
          $mySavedData.items[returnObj.getItemKey(serverItem)] = serverItem;
          saveListToSession();
        }
      }

      returnObj.syncItem = function (itemToSync) {
        var existingItem = returnObj.getItem(itemToSync.ItemId, itemToSync.ItemTypeId) || itemToSync;
        if (existingItem != itemToSync) {
          existingItem.Quantity = itemToSync.Quantity;
        }

        if (parseInt(existingItem.Quantity) > 0) {
          // build new item to make sure posting of only required fields
          var itemToPost = angular.copy(existingItem);

          itemToPost['BarcodeImageUrl'] = undefined;
          itemToPost['BottomTagLine'] = undefined;
          itemToPost['Description1'] = undefined;
          itemToPost['Description2'] = undefined;
          itemToPost['Description3'] = undefined;
          itemToPost['Description4'] = undefined;
          itemToPost['EndDate'] = undefined;
          itemToPost['ImageUrl'] = undefined;
          itemToPost['SmallImageUrl'] = undefined;
          itemToPost['StartDate'] = undefined;
          itemToPost['TopTagLine'] = undefined;
          itemToPost['TotalDownloads'] = undefined;
          itemToPost['TotalDownloadsAllowed'] = undefined;
          itemToPost['Varieties'] = undefined;
          itemToPost['PageNumber'] = undefined;
          itemToPost['rect'] = undefined;
          itemToPost['LinkedItem'] = undefined;

          $rootScope.$broadcast('gsnevent:shoppinglistitem-updating', returnObj, existingItem, $mySavedData);

          gsnApi.getAccessToken().then(function () {

            var url = gsnApi.getShoppingListApiUrl() + '/UpdateItem/' + returnObj.ShoppingListId;
            var hPayload = gsnApi.getApiHeaders();
            hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
            $http.post(url, itemToPost, { headers: hPayload }).success(function (response) {
              if (response.Id) {
                processServerItem(response, existingItem);
              }

              $rootScope.$broadcast('gsnevent:shoppinglist-changed', returnObj);
              saveListToSession();
            }).error(function () {
              // reset to previous quantity on failure
              if (existingItem.OldQuantity) {
                existingItem.NewQuantity = existingItem.OldQuantity;
                existingItem.Quantity = existingItem.OldQuantity;
                saveListToSession();
              }
            });
          });
        } else {
          returnObj.removeItem(existingItem);
        }

        saveListToSession();
        $rootScope.$broadcast('gsnevent:shoppinglist-changed', returnObj);
      };

      // add item to list
      returnObj.addItem = function (item, deferSync) {
        if (gsnApi.isNull(item.ItemId, 0) <= 0) {

          // this is to help with getItemKey?
          item.ItemId = ($mySavedData.itemIdentity++);
        }

        $mySavedData.countCache = 0;
        var existingItem = $mySavedData.items[returnObj.getItemKey(item)];

        if (gsn.isNull(existingItem, null) === null) {
          // remove any ties to existing shopping list
          item.Id = undefined;
          item.ShoppingListItemId = undefined;
          item.ShoppingListId = returnObj.ShoppingListId;
          item.CategoryId = item.CategoryId || -1;

          existingItem = item;
          $mySavedData.items[returnObj.getItemKey(existingItem)] = existingItem;
        }
        else { // update existing item

          var newQuantity = gsnApi.isNaN(parseInt(item.Quantity), 1);
          var existingQuantity = gsnApi.isNaN(parseInt(existingItem.Quantity), 1);
          if (newQuantity > existingQuantity) {
            existingItem.Quantity = newQuantity;
          } else {
            existingItem.Quantity = existingQuantity + newQuantity;
          }
        }

        if (existingItem.IsCoupon) {

          // Get the temp quantity.
          var tmpQuantity = gsnApi.isNaN(parseInt(existingItem.Quantity), 0);

          // Now, assign the quantity.
          existingItem.Quantity = (tmpQuantity > 0) ? tmpQuantity : 1;
        }

        existingItem.Order = ($mySavedData.itemIdentity++);

        if (!gsnApi.isNull(deferSync, false)) {
          returnObj.syncItem(existingItem);
        } else
        {
          saveListToSession();
        }

        return existingItem;
      };

      returnObj.addItems = function (items) {
        var deferred = $q.defer();
        var toAdd = [];
        angular.forEach(items, function (v, k) {
          var rst = angular.copy(returnObj.addItem(v, true));
          toAdd.push(rst);
        });

        $rootScope.$broadcast('gsnevent:shoppinglistitems-updating', returnObj);
        saveListToSession();

        gsnApi.getAccessToken().then(function () {

          var url = gsnApi.getShoppingListApiUrl() + '/SaveItems/' + returnObj.ShoppingListId;
          var hPayload = gsnApi.getApiHeaders();
          hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
          $http.post(url, toAdd, { headers: hPayload }).success(function (response) {
            $rootScope.$broadcast('gsnevent:shoppinglist-changed', returnObj);
            deferred.resolve({ success: true, response: response });
            saveListToSession();
          }).error(function () {
            deferred.resolve({ success: false, response: response });
          });
        });

        return deferred.promise;
      };

      // remove item from list
      returnObj.removeItem = function (inputItem, deferRemove) {
        var item = returnObj.getItem(inputItem);
        if (item) {
          item.Quantity = 0;

          // stupid ie8, can't simply delete
          var removeK = returnObj.getItemKey(item);
          try {
            delete $mySavedData.items[removeK];
          }
          catch (e) {

            var items = {};
            angular.forEach($mySavedData.items, function(v, k) {
              if (k != removeK)
                items[k] = v;
            });

            $mySavedData.items = items;
          }

          saveListToSession();

          if (deferRemove) return returnObj;
          gsnApi.getAccessToken().then(function () {
            $rootScope.$broadcast('gsnevent:shoppinglistitem-removing', returnObj, item);

            var url = gsnApi.getShoppingListApiUrl() + '/DeleteItems/' + returnObj.ShoppingListId;
            var hPayload = gsnApi.getApiHeaders();
            hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
            $http.post(url, [item.Id || item.ItemId], { headers: hPayload }).success(function (response) {
              $rootScope.$broadcast('gsnevent:shoppinglist-changed', returnObj);
              saveListToSession();
            });
          });
        }

        return returnObj;
      };

      // get item by object or id
      returnObj.getItem = function (itemId, itemTypeId) {
        // just return whatever found, no need to validate item
        // it's up to the user to call isValidItem to validate
        var adCode, brandName, myDescription;
        if (typeof (itemId) == "object") {
          adCode = itemId.AdCode;
          brandName = itemId.BrandName;
          myDescription = itemId.Description;
          itemTypeId = itemId.ItemTypeId;
          itemId = itemId.ItemId;
        }

        var myItemKey = returnObj.getItemKey({ ItemId: itemId, ItemTypeId: gsnApi.isNull(itemTypeId, 8), AdCode: adCode, BrandName: brandName, Description: myDescription });
        return $mySavedData.items[myItemKey];
      };

      returnObj.isValidItem = function (item) {
        var itemType = typeof (item);

        if (itemType !== 'undefined' && itemType !== 'function') {
          return (item.Quantity > 0);
        }

        return false;
      };

      // return all items
      returnObj.allItems = function () {
        var result = [];
        var items = $mySavedData.items;
        angular.forEach(items, function (item, index) {
          if (returnObj.isValidItem(item)) {
            result.push(item);
          }
        });

        return result;
      };

      // get count of items
      returnObj.getCount = function () {
        if ($mySavedData.countCache > 0) return $mySavedData.countCache;

        var count = 0;
        var items = $mySavedData.items;
        var isValid = true;
        angular.forEach(items, function(item, index) {
          if (!item){
            isValid = false;
            return;
          }

          if (returnObj.isValidItem(item)) {
            count += gsnApi.isNaN(parseInt(item.Quantity), 0);
          }
        });

        if (!isValid){
          $mySavedData.items = {};
          $mySavedData.hasLoaded = false;
          returnObj.updateShoppingList();
        }

        $mySavedData.countCache = count;
        return count;
      };

      // clear items
      returnObj.clearItems = function () {
        // clear the items
        $mySavedData.items = {};
        returnObj.saveChanges();
      };

      returnObj.getTitle = function () {
        return ($mySavedData.list) ? $mySavedData.list.Title : '';
      };

      returnObj.getStatus = function () {
        return ($mySavedData.list) ? $mySavedData.list.StatusId : 1;
      };

      // cause shopping list delete
      returnObj.deleteList = function () {
        // call DeleteShoppingList

        $mySavedData.countCache = 0;
        gsnApi.getAccessToken().then(function () {

          var url = gsnApi.getShoppingListApiUrl() + '/Delete/' + returnObj.ShoppingListId;
          var hPayload = gsnApi.getApiHeaders();
          hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
          $http.post(url, {}, { headers: hPayload }).success(function (response) {
            // do nothing
            $rootScope.$broadcast('gsnevent:shoppinglist-deleted', returnObj);
            saveListToSession();
          });
        });

        return returnObj;
      };

      // save changes
      returnObj.saveChanges = function () {
        if (returnObj.savingDeferred) return returnObj.savingDeferred.promise;
        var deferred = $q.defer();
        returnObj.savingDeferred = deferred;

        $mySavedData.countCache = 0;
        var syncitems = [];

        // since we immediately update item with server as it get added to list
        // all we need is to send back the item id to tell server item still on list
        // this is also how we mass delete items
        var items = returnObj.allItems();
        angular.forEach(items, function (item) {
          syncitems.push(item.ItemId);
        });

        saveListToSession();

        gsnApi.getAccessToken().then(function () {

          var url = gsnApi.getShoppingListApiUrl() + '/DeleteOtherItems/' + returnObj.ShoppingListId;
          var hPayload = gsnApi.getApiHeaders();
          hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
          $http.post(url, syncitems, { headers: hPayload }).success(function (response) {
            deferred.resolve({ success: true, response: returnObj });
            returnObj.savingDeferred = null;

            $rootScope.$broadcast('gsnevent:shoppinglist-changed', returnObj);
            saveListToSession();
          }).error(function (response) {
            deferred.resolve({ success: false, response: response });
            returnObj.savingDeferred = null;
          });
        });

        return deferred.promise;
      };

      // cause change to shopping list title
      returnObj.setTitle = function (title) {
        var deferred = $q.defer();

        $mySavedData.countCache = 0;
        gsnApi.getAccessToken().then(function () {

          var url = gsnApi.getShoppingListApiUrl() + '/Update/' + returnObj.ShoppingListId + '?title=' + encodeURIComponent(title);
          var hPayload = gsnApi.getApiHeaders();
          hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
          $http.post(url, {}, { headers: hPayload }).success(function (response) {
            deferred.resolve({ success: true, response: returnObj });
            $mySavedData.list.Title = title;

            // Send these two broadcast messages.
            $rootScope.$broadcast('gsnevent:shopping-list-saved');
            $rootScope.$broadcast('gsnevent:shoppinglist-changed', returnObj);
            saveListToSession();
          }).error(function (response) {
            console.log(returnObj.ShoppingListId + ' setTitle error: ' + response);
            deferred.resolve({ success: false, response: response });
          });
        });

        return deferred.promise;
      };

      returnObj.hasLoaded = function () {
        return $mySavedData.hasLoaded;
      };

      returnObj.getListData = function() {
        return angular.copy($mySavedData.list);
      };

      function saveListToSession() {
        betterStorage.currentShoppingList = $mySavedData;

        // Since we are chainging the saved data, the count is suspect.
        $mySavedData.countCache = 0;
      }

      function loadListFromSession() {
        var list = betterStorage.currentShoppingList;
        if (list && list.list && list.list.Id == shoppingListId) {
          var isValid = true;
          angular.forEach(list.items, function(v, k){
            if (gsnApi.isNull(v)) {
              isValid = false;
            }
          });

          if (isValid) {
            $mySavedData.hasLoaded = list.hasLoaded;
            $mySavedData.items = list.items;
            $mySavedData.itemIdentity = list.itemIdentity;
            $mySavedData.countCache = list.countCache;
          }
          else {
            $mySavedData.hasLoaded = false;
            returnObj.updateShoppingList();
          }
        }
      }


      function processShoppingList(result) {
        $mySavedData.items = {};

        angular.forEach(result, function (item, index) {
          item.Order = index;
          $mySavedData.items[returnObj.getItemKey(item)] = item;
        });

        $mySavedData.hasLoaded = true;
        $mySavedData.itemIdentity = result.length + 1;
        $rootScope.$broadcast('gsnevent:shoppinglist-loaded', returnObj, result);
        saveListToSession();
      }

      returnObj.updateShoppingList = function () {
        if (returnObj.deferred) return returnObj.deferred.promise;

        var deferred = $q.defer();
        returnObj.deferred = deferred;

        if (returnObj.ShoppingListId > 0) {
          if ($mySavedData.hasLoaded) {
            $rootScope.$broadcast('gsnevent:shoppinglist-loaded', returnObj, $mySavedData.items);
            deferred.resolve({ success: true, response: returnObj });
            returnObj.deferred = null;
          } else {

            $mySavedData.items = {};
            $mySavedData.countCache = 0;

            gsnApi.getAccessToken().then(function () {
              // call GetShoppingList(int shoppinglistid, int profileid)
              var url = gsnApi.getShoppingListApiUrl() + '/ItemsBy/' + returnObj.ShoppingListId + '?nocache=' + (new Date()).getTime();

              var hPayload = gsnApi.getApiHeaders();
              hPayload["X-SHOPPING-LIST-ID"] = returnObj.ShoppingListId;
              $http.get(url, { headers: hPayload }).success(function (response) {
                processShoppingList(response);
                $rootScope.$broadcast('gsnevent:shoppinglist-loaded', returnObj, $mySavedData.items);
                deferred.resolve({ success: true, response: returnObj });
                returnObj.deferred = null;
              }).error(function (response) {
                $rootScope.$broadcast('gsnevent:shoppinglist-loadfail', response);
                deferred.resolve({ success: false, response: response });
                returnObj.deferred = null;
              });
            });
          }
        }

        return deferred.promise;
      };

      loadListFromSession();

      return returnObj;
    }

    return myShoppingList;
  }
})(angular);

// collection of misc service and factory
(function (angular, undefined) {
    'use strict';
    var myModule = angular.module('gsn.core');
    /**
     * allow for cross platform notification
     */
    myModule.service('$notification', ['$rootScope', '$window', function ($rootScope, $window) {
        var service = {
            alert: function (message) {
                if (!$window.isPhoneGap) {
                    gmodal.show({
                        content: '<div class="myModalForm" style="display: block"><div class="modal-dialog"><div class="modal-content"><div class="modal-body">' + message + '<br /><br/><button class="btn btn-default gmodal-close pull-right" style="width: 80px" data-ng-click="closeModal()">OK</button><br /></div></div></div></div>',
                        hideOn: "click,esc,tap"
                    })
                    return;
                }
                navigator.notification.alert(message, null, '', 'OK');
            },
            confirm: function (message, callbackFn, title, buttonLabels) {
                if (gsn.isNull(buttonLabels, null) === null) {
                    buttonLabels = 'OK,Cancel';
                }
                if (!$window.isPhoneGap) {
                    callbackFn($window.confirm(message) ? 1 : 2);
                    return;
                }
                navigator.notification.confirm(message, // message
                    callbackFn, // callback to invoke with index of button pressed
                    title, // title
                    buttonLabels.split(',') // buttonLabels
                );
            },
            prompt: function (message, callbackFn, title, defaultText, buttonLabels) {
                if (gsn.isNull(buttonLabels, null) === null) {
                    buttonLabels = 'OK,Cancel';
                }
                if (gsn.isNull(defaultText, null) === null) {
                    defaultText = '';
                }
                if (!$window.isPhoneGap) {
                    var answer = $window.prompt(message, defaultText);
                    callbackFn({
                        buttonIndex: (answer ? 1 : 2),
                        input1: answer
                    });
                    return;
                }
                navigator.notification.prompt(message, // message
                    callbackFn, // callback to invoke
                    title, // title
                    buttonLabels.split(','), defaultText);
            }
        };
        return service;
    }]);
    // debounce: for performance
    myModule.factory('debounce', ['$timeout', function ($timeout) {
        // The service is actually this function, which we call with the func
        // that should be debounced and how long to wait in between calls
        return function debounce(func, wait, immediate) {
            var timeout;
            return function () {
                var context = this,
                    args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };
    }]);
    // FeedService: google feed
    myModule.factory('FeedService', ['$http', 'gsnApi', function ($http, gsnApi) {
        return {
            parseFeed: function (url, maxResult) {
                return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + gsnApi.isNull(maxResult, 50) + '&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
            }
        };
    }]);
    // gsnAuthenticationHandler to handle expired refresh token
    myModule.factory('gsnAuthenticationHandler', ['$rootScope', '$q', function ($rootScope, $q) {
        var service = {
            responseError: function (response, code) {
                // intercept 401
                if (response.status == 401) {
                    $rootScope.$broadcast('gsnevent:auth-expired', arguments);
                } else if (response.status == 400) {
                    if (response.data && typeof response.data == 'string') {
                        if ((response.data.indexOf('refresh_token is invalid or has expired') > -1) || (response.data.indexOf('Illegal attempt to refresh an anonymous token for user that is no longer anonymous.') > -1)) {
                            $rootScope.$broadcast('gsnevent:auth-invalidrefresh', arguments);
                        }
                    }
                }
                // do something on error
                return $q.reject(response);
            }
        };
        return service;
        //#region Internal Methods
        //#endregion
    }]);
    /**
     * Detect display mode
     */
    myModule.directive('bsDisplayMode', ['$window', '$timeout', function ($window, $timeout) {
        return {
            template: '<div class="visible-xs"></div><div class="visible-sm"></div><div class="visible-md"></div><div class="visible-lg"></div>',
            restrict: 'EA',
            replace: false,
            link: function (scope, elem, attrs) {
                var markers = elem.find('div');

                function update() {
                    angular.forEach(markers, function (element) {
                        if (angular.element(element).is(":visible")) {
                            scope[attrs.bsDisplayMode] = element.className;
                        }
                    });
                }
                angular.element($window).bind('resize', function () {
                    // use timeout to overcome scope apply
                    $timeout(update, 300);
                });
                update();
            }
        };
    }]);
    /**
     * bind scrollTo event on click
     */
    myModule.directive('scrollTo', ['$location', '$anchorScroll', function ($location, $anchorScroll) {
        return function (scope, element, attrs) {
            element.bind('click', function (event) {
                event.stopPropagation();
                var off = scope.$on('$locationChangeStart', function (ev) {
                    off();
                    ev.preventDefault();
                });
                var location = attrs.scrollTo;
                $location.hash(location);
                $anchorScroll();
            });
        };
    }]);
    /**
     * create scrollTop marker
     */
    myModule.directive('ngScrollTop', ['$window', '$timeout', 'debounce', function ($window, $timeout, debounce) {
        var directive = {
            link: link,
            restrict: 'A',
        };
        // if more than 1 scrollTop on page - disable show/hide of element
        var countScrollTop = 0;
        return directive;

        function link(scope, element, attrs) {
            countScrollTop++;
            var myScrollTop = debounce(function () {
                scope.scrollTop = angular.element($window).scrollTop();
                element.css({
                    'display': ((scope.scrollTop > parseInt(attrs.offset)) && countScrollTop == 1) ? 'block' : ''
                });
            }, 300);
            angular.element($window).on('scroll', myScrollTop);
            element.on('click', function () {
                angular.element($window).scrollTop(0);
            });
            scope.$on('$destroy', function () {
                countScrollTop--;
            });
        }
    }]);
    /**
     * stop event probagation
     */
    myModule.directive('stopEvent', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                element.bind(attr.stopEvent, function (e) {
                    e.stopPropagation();
                });
            }
        };
    });
})(angular);
(function (angular, undefined) {
  'use strict';
  var serviceId = 'gsnProLogicRewardCard';
  angular.module('gsn.core').service(serviceId, ['gsnApi', '$http', '$rootScope', '$timeout', gsnProLogicRewardCard]);

  function gsnProLogicRewardCard(gsnApi, $http, $rootScope, $timeout) {

    var returnObj = {};

    returnObj.rewardCard = null;
    returnObj.isValid = false;

    returnObj.getLoyaltyCard = function (profile, callback) {
      if (returnObj.rewardCard !== null) {
        $timeout(function () { callback(returnObj.rewardCard, returnObj.isValid); }, 500);
      } else if ((profile.ExternalId || '').length < 2) {
        callback(null, false);
      } else {
        var url = gsnApi.getStoreUrl().replace(/store/gi, 'ProLogic') + '/GetCardMember/' + gsnApi.getChainId() + '/' + profile.ExternalId;
        $http.get(url).success(function(response) {
          returnObj.rewardCard = response.Response;
          if (gsnApi.isNull(returnObj.rewardCard, null) !== null) {
            var gsnLastName = profile.LastName.toUpperCase().replace(/\s+/gi, '');
            var proLogicLastName = returnObj.rewardCard.Member.LastName.toUpperCase().replace(/\s+/gi, '');

            // The names can differ, but the names must be in the 
            if ((gsnLastName == proLogicLastName) || (proLogicLastName.indexOf(gsnLastName) >= 0) || (gsnLastName.indexOf(proLogicLastName) >= 0)) {
              returnObj.isValid = true;
            }
          } else {
            returnObj.rewardCard = null;
          }
          callback(returnObj.rewardCard, returnObj.isValid);
        });
      }
    };

    $rootScope.$on('gsnevent:logout', function () {
      returnObj.rewardCard = null;
      returnObj.isValid = false;
    });

    return returnObj;
  }
})(angular);

(function(angular, undefined) {
  'use strict';
  var serviceId = 'gsnProfile';
  angular.module('gsn.core').service(serviceId, ['$rootScope', '$http', 'gsnApi', '$q', 'gsnList', 'gsnStore', '$location', '$timeout', '$sessionStorage', '$localStorage', gsnProfile]);

  function gsnProfile($rootScope, $http, gsnApi, $q, gsnList, gsnStore, $location, $timeout, $sessionStorage, $localStorage) {
    var returnObj = {},
      previousProfileId = gsnApi.getProfileId(),
      couponStorage = $sessionStorage,
      $profileDefer = null,
      $creatingDefer = null,
      $savedData = {
        allShoppingLists: {},
        profile: null,
        profileData: {
          scoredProducts: {},
          circularItems: {},
          availableCoupons: {},
          myPantry: {}
        }
      };

    $rootScope[serviceId] = returnObj;
    gsnApi.gsn.$profile = returnObj;
    returnObj.getShoppingListId = gsnApi.getShoppingListId;

    returnObj.getProfileId = gsnApi.getProfileId;

    returnObj.createNewShoppingList = function() {
      /// <summary>Create a new shopping list.</summary>

      if ($creatingDefer) return $creatingDefer.promise;

      $creatingDefer = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getShoppingListApiUrl() + '/Create/' + gsnApi.getProfileId();
        $http.post(url, {}, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          var result = response;
          $savedData.allShoppingLists[result.Id] = gsnList(result.Id, result);
          gsnApi.setShoppingListId(result.Id);
          $rootScope.$broadcast('gsnevent:shoppinglist-created', $savedData.allShoppingLists[result.Id]);
          $creatingDefer.resolve({
            success: true,
            response: $savedData.allShoppingLists[result.Id]
          });
          $creatingDefer = null;
        }).error(function(response) {
          $creatingDefer.resolve({
            success: false,
            response: response
          });
          $creatingDefer = null;
        });
      });

      return $creatingDefer.promise;
    };

    returnObj.login = function(user, pass) {
      var payload = {
        grant_type: "password",
        client_id: gsnApi.getChainId(),
        access_type: 'offline',
        username: user,
        password: pass
      };

      gsnApi.doAuthenticate(payload);
    };

    returnObj.loginFacebook = function(user, facebookToken) {
      if (!gsnApi.getConfig().FacebookAppId) {
        return;
      }

      var payload = {
        grant_type: "facebook",
        client_id: gsnApi.getChainId(),
        access_type: 'offline',
        username: user,
        password: facebookToken
      };

      gsnApi.doAuthenticate(payload);
    };

    // when initialize
    // if no profile id, it should create a shopping list to get a new profile id and set to current
    returnObj.initialize = function() {
      // get profile
      var profileId = parseInt(gsnApi.isNull(returnObj.getProfileId(), 0));
      if (profileId > 0) {
        returnObj.getProfile(true);
      }

      gsnStore.initialize();
    };

    // when user log out
    // it should reset shopping list
    returnObj.logOut = function() {
      gsnApi.logOut();
      couponStorage.clipped = [];
      couponStorage.printed = [];
      couponStorage.preClipped = {};
    };

    // proxy method to add item to current shopping list
    returnObj.addItem = function(item) {
      var shoppingList = returnObj.getShoppingList();
      if (shoppingList) {
        if (gsnApi.isNull(item.ItemTypeId, -1) < 0) {
          item.ItemTypeId = 6; // Misc or Own Item type
        }

        shoppingList.addItem(item);
      }
    };

    // proxy method to add items to current shopping list
    returnObj.addItems = function(item) {
      var shoppingList = returnObj.getShoppingList();

      // TODO: throw error for no current shopping list?
      return shoppingList.addItems(item);
    };

    returnObj.isOnList = function(item) {
      var shoppingList = returnObj.getShoppingList();
      if (shoppingList) {
        var slItem = shoppingList.getItem(item.ItemId, item.ItemTypeId);
        return gsnApi.isNull(slItem, null) !== null;
      }

      return false;
    };

    // proxy method to remove item of current shopping list
    returnObj.removeItem = function(item) {
      var shoppingList = returnObj.getShoppingList();
      if (shoppingList) {
        shoppingList.removeItem(item);
      }
    };

    // delete shopping list provided id
    returnObj.deleteShoppingList = function(list) {
      list.deleteList();
      $savedData.allShoppingLists[list.ShoppingListId] = null;
    };

    // get shopping list provided id
    returnObj.getShoppingList = function(shoppingListId) {
      if (gsnApi.isNull(shoppingListId, null) === null)
        shoppingListId = returnObj.getShoppingListId();

      var result = $savedData.allShoppingLists[shoppingListId];
      return result;
    };

    // get all shopping lists
    returnObj.getShoppingLists = function() {
      var result = [];
      angular.forEach($savedData.allShoppingLists, function(v, k) {
        result.push(v);
      });

      gsnApi.sortOn(result, 'ShoppingListId');
      result.reverse();
      return result;
    };

    // get count of current shopping list
    returnObj.getShoppingListCount = function() {
      var list = returnObj.getShoppingList();
      return list ? list.getCount() : 0;
    };

    // get the profile object
    returnObj.getProfile = function(callApi) {
      if ($profileDefer) return $profileDefer.promise;

      $profileDefer = $q.defer();
      if (gsnApi.isNull($savedData.profile, null) === null || callApi) {
        // at this point, we already got the id so proceed to reset other data
        $timeout(function() {
          // reset other data
          $savedData = {
            allShoppingLists: {},
            profile: null,
            profileData: {
              scoredProducts: {},
              circularItems: {},
              availableCoupons: {},
              myPantry: {}
            }
          };
          returnObj.refreshShoppingLists();
        }, 5);


        gsnApi.getAccessToken().then(function() {

          // don't need to load profile if anonymous
          if (gsnApi.isAnonymous()) {
            $savedData.profile = {
              "Id": returnObj.getProfileId(),
              "SiteId": gsnApi.getChainId(),
              "PrimaryStoreId": gsnApi.getSelectedStoreId()
            };

            $rootScope.$broadcast('gsnevent:profile-load-success', {
              success: true,
              response: $savedData.profile
            });
            $profileDefer.resolve({
              success: true,
              response: $savedData.profile
            });
            $profileDefer = null;
          } else {
            gsnLoadProfile();
          }
        });

      } else {
        $timeout(function() {
          $profileDefer.resolve({
            success: true,
            response: $savedData.profile
          });
          $profileDefer = null;
        }, 10);
      }

      return $profileDefer.promise;
    };

    function gsnLoadProfile() {
      var url = gsnApi.getProfileApiUrl() + "/By/" + returnObj.getProfileId();
      $http.get(url, {
        headers: gsnApi.getApiHeaders()
      }).success(function(response) {
        $savedData.profile = response;
        $rootScope.$broadcast('gsnevent:profile-load-success', {
          success: true,
          response: $savedData.profile
        });
        $profileDefer.resolve({
          success: true,
          response: $savedData.profile
        });
        $profileDefer = null;
      }).error(function(response) {
        $rootScope.$broadcast('gsnevent:profile-load-failed', {
          success: false,
          response: response
        });
        $profileDefer.resolve({
          success: false,
          response: response
        });
        $profileDefer = null;
      });
    }

    // when user register
    // it should convert anonymous profile to perm
    returnObj.registerProfile = function(p) {
      return registerOrUpdateProfile(p, false);
    };

    returnObj.changePassword = function(userName, currentPassword, newPassword) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/ChangePassword";
        $http.post(url, {
          UserName: userName,
          Password: currentPassword,
          NewPassword: newPassword
        }, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: (response == 'true'),
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    // when user recover password
    // it should call api and return server result
    returnObj.recoverPassword = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + '/RecoverPassword';
        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: (response == 'true'),
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.recoverUsername = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + '/RecoverUsername';
        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: (response == 'true'),
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.unsubscribeEmail = function(email) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + '/Unsubscribe/?email=' + encodeURIComponent(email);
        $http.post(url, {
          email: email
        }, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    // when user update profile
    // it should restore user old password if none is provided
    returnObj.updateProfile = function(p) {
      return registerOrUpdateProfile(p, true);
    };

    // when user is a registered user
    // allow for shopping lists refresh
    returnObj.refreshShoppingLists = function() {
      if (returnObj.refreshingDeferred) return returnObj.refreshingDeferred.promise;

      // determine if logged in
      // sync list
      var deferred = $q.defer();
      returnObj.refreshingDeferred = deferred;
      $savedData.allShoppingLists = {};

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getShoppingListApiUrl() + '/List/' + gsnApi.getProfileId();
        $http.get(url, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          if (response.length > 0) {
            for (var i = 0; i < response.length; i++) {
              var list = response[i];
              list.ShoppingListId = list.Id;
              var shoppingList = gsnList(list.ShoppingListId, list);
              $savedData.allShoppingLists[list.ShoppingListId] = shoppingList;

              // grab the first shopping list and make it current list id
              if (i === 0) {
                // ajax load first shopping list
                shoppingList.updateShoppingList();

                gsnApi.setShoppingListId(list.ShoppingListId);
              }
            }
          } else {
            returnObj.createNewShoppingList();
          }

          returnObj.refreshingDeferred = null;

          $rootScope.$broadcast('gsnevent:shoppinglists-loaded', {
            success: true,
            response: response
          });
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {

          returnObj.refreshingDeferred = null;
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.getMyCircularItems = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetCircularItems/' + gsnApi.getProfileId();
      return gsnApi.http($savedData.profileData.circularItems, url);
    };

    returnObj.getMyPantry = function(departmentId, categoryId) {
      var url = gsnApi.getProfileApiUrl() + '/GetPantry/' + gsnApi.getProfileId() + '?' + 'departmentId=' + gsnApi.isNull(departmentId, '') + '&categoryId=' + gsnApi.isNull(categoryId, '');
      return gsnApi.http($savedData.profileData.myPantry, url);
    };

    returnObj.getMyPantry2 = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetPantry2/' + gsnApi.getChainId() + '/' + gsnApi.getProfileId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http($savedData.profileData.myPantry, url);
    };

    returnObj.getMyProducts = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetScoredProducts/' + gsnApi.getProfileId();
      return gsnApi.http($savedData.profileData.scoredProducts, url);
    };

    returnObj.getMyRecipes = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetSavedRecipes/' + gsnApi.getProfileId();
      return gsnApi.http({}, url);
    };

    returnObj.rateRecipe = function(recipeId, rating) {
      var url = gsnApi.getProfileApiUrl() + '/RateRecipe/' + recipeId + '/' + gsnApi.getProfileId() + '/' + rating;
      return gsnApi.http({}, url, {});
    };

    returnObj.getMyRecipe = function(recipeId) {
      var url = gsnApi.getProfileApiUrl() + '/GetSavedRecipe/' + gsnApi.getProfileId() + '/' + recipeId;
      return gsnApi.http({}, url);
    };

    returnObj.saveRecipe = function(recipeId, comment) {
      var url = gsnApi.getProfileApiUrl() + '/SaveRecipe/' + recipeId + '/' + gsnApi.getProfileId() + '?comment=' + encodeURIComponent(comment);
      return gsnApi.http({}, url, {});
    };

    returnObj.saveProduct = function(productId, comment) {
      var url = gsnApi.getProfileApiUrl() + '/SaveProduct/' + productId + '/' + gsnApi.getProfileId() + '?comment=' + encodeURIComponent(comment);
      return gsnApi.http({}, url, {});
    };

    returnObj.selectStore = function(storeId) {
      var url = gsnApi.getProfileApiUrl() + '/SelectStore/' + gsnApi.getProfileId() + '/' + storeId;
      return gsnApi.http({}, url, {});
    };

    returnObj.getCampaign = function() {
      var url = gsnApi.getProfileApiUrl() + '/GetCampaign/' + gsnApi.getProfileId();
      return gsnApi.http({}, url);
    };

    returnObj.resetCampaign = function() {
      $sessionStorage.GsnCampaign = 0;
    };

    returnObj.sendContactUs = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/SendContactUs";

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.sendEmail = function(payload) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/SendEmail";

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.sendEmploymentEmail = function(payload, selectedStoreId) {
      var deferred = $q.defer();

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + "/SendEmployment/" + selectedStoreId;

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders(),
        }).success(function(response) {
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {
          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    };

    returnObj.clipCoupon = function(productCode) {
      if (!couponStorage.clipped)
        couponStorage.clipped = [];
      if (couponStorage.clipped.indexOf(productCode) < 0)
        couponStorage.clipped.push(productCode);
    };

    returnObj.unclipCoupon = function(productCode) {
      var index = couponStorage.clipped.indexOf(productCode);
      couponStorage.clipped.splice(index, 1);
    };

    returnObj.getClippedCoupons = function() {
      return couponStorage.clipped;
    };

    returnObj.savePreclippedCoupon = function(item) {
      couponStorage.preClipped = item;
    };

    returnObj.getPreclippedCoupon = function() {
      return couponStorage.preClipped;
    };

    returnObj.addPrinted = function(productCode) {
      if (!couponStorage.printed)
        couponStorage.printed = [];
      if (couponStorage.printed.indexOf(productCode) < 0)
        couponStorage.printed.push(productCode);
    };

    returnObj.getPrintedCoupons = function() {
      return couponStorage.printed;
    };

    //#region Events Handling
    $rootScope.$on('gsnevent:shoppinglist-item-response', function(event, args) {
      var response = args[1],
        existingItem = args[2],
        mySavedData = args[3];

      // only process server response if logged in
      if (gsnApi.isLoggedIn()) {

        if (existingItem.ItemId != response.ItemId) {
          mySavedData.items[existingItem.ItemId] = null;
          existingItem.ItemId = response.ItemId;
        }

        // retain order
        if (existingItem.zPriceMultiple) {
          response.PriceMultiple = existingItem.zPriceMultiple;
        }

        response.Order = existingItem.Order;
        mySavedData.items[existingItem.ItemId] = response.d;
      }
    });

    $rootScope.$on('gsnevent:profile-setid', function(event, profileId) {
      // attempt to load profile
      if (previousProfileId != profileId) {
        previousProfileId = profileId;
        returnObj.getProfile(true);
        returnObj.resetCampaign();
      }
    });

    $rootScope.$on('gsnevent:profile-load-success', function(event, result) {
      // attempt to set store id
      if (gsnApi.isNull(result.response.PrimaryStoreId, 0) > 0) {
        gsnApi.setSelectedStoreId(result.response.PrimaryStoreId);
      }
    });

    $rootScope.$on('gsnevent:store-setid', function(event, values) {
      if (values.newValue != values.oldValue) {
        // must check for null because it could be that user just
        // logged in and he/she would no longer have the anonymous shopping list
        var currentList = returnObj.getShoppingList();
        if (currentList) {
          currentList.updateShoppingList();
        }
      }
    });

    //#endregion

    //#region helper methods
    function registerOrUpdateProfile(profile, isUpdate) {
      /// <summary>Helper method for registering or update profile</summary>

      var deferred = $q.defer();

      // clean up model before proceeding
      // there should not be any space in email or username
      var email = gsnApi.isNull(profile.Email, '').replace(/\s+/gi, '');
      var username = gsnApi.isNull(profile.UserName, '').replace(/\s+/gi, '');
      if (username.length <= 0) {
        username = email;
      }

      // set empty to prevent update
      if (email.length <= 0) {
        email = null;
      }
      if (username.length <= 0) {
        username = null;
      }

      // setting up the payload, should we also add another level of validation here?
      var payload = {
        Email: email,
        UserName: username,
        Password: gsnApi.isNull(profile.Password, ''),
        ReceiveEmail: gsnApi.isNull(profile.ReceiveEmail, false),
        ReceivePostalMail: gsnApi.isNull(profile.ReceivePostalMail, false),
        ReceiveSms: gsnApi.isNull(profile.ReceiveSms, true),
        Phone: gsnApi.isNull(profile.Phone, '').replace(/[^0-9]+/gi, ''),
        PrimaryStoreId: gsnApi.isNull(profile.PrimaryStoreId, gsnApi.getSelectedStoreId()),
        FirstName: gsnApi.isNull(profile.FirstName, '').replace(/[`]+/gi, '\''),
        LastName: gsnApi.isNull(profile.LastName, '').replace(/[`]+/gi, '\''),
        ExternalId: profile.ExternalId,
        WelcomeSubject: profile.WelcomeSubject,
        WelcomeMessage: profile.WelcomeMessage,
        FacebookUserId: profile.FacebookUserId,
        SiteId: gsnApi.getChainId(),
        Id: gsnApi.getProfileId()
      };

      // set empty to prevent update
      if (payload.Password === '') {
        payload.Password = null;
      }
      if (payload.LastName === '') {
        payload.LastName = null;
      }
      if (payload.FirstName === '') {
        payload.FirstName = null;
      }
      if (gsnApi.isNull(payload.PrimaryStoreId, 0) <= 0) {
        payload.PrimaryStoreId = null;
      }
      if (gsnApi.isNull(profile.ExternalId, '').length <= 0) {
        profile.ExternalId = null;
      }
      if (gsnApi.isNull(profile.FacebookUserId, '').length <= 0) {
        profile.FacebookUserId = null;
      }

      if (payload.UserName.length < 3) {
        deferred.resolve({
          success: false,
          response: 'Email/UserName must be at least 3 characters.'
        });
        return deferred.promise;
      }

      if (!isUpdate && (gsnApi.isNull(profile.FacebookToken, '').length <= 0)) {
        if (gsnApi.isNull(payload.Password, '').length < 6) {
          deferred.resolve({
            success: false,
            response: 'Password must be at least 6 characters.'
          });
          return deferred.promise;
        }
      }

      if (!gsnApi.getEmailRegEx().test(payload.Email)) {
        deferred.resolve({
          success: false,
          response: 'Email is invalid.'
        });
        return deferred.promise;
      }

      gsnApi.getAccessToken().then(function() {
        var url = gsnApi.getProfileApiUrl() + (isUpdate ? "/Update" : "/Register");
        if (gsnApi.isNull(profile.FacebookToken, '').length > 1) {
          url += 'Facebook';
          payload.Password = profile.FacebookToken;
        }

        $http.post(url, payload, {
          headers: gsnApi.getApiHeaders()
        }).success(function(response) {
          // set current profile to response
          $savedData.profile = response;
          deferred.resolve({
            success: true,
            response: response
          });
        }).error(function(response) {

          deferred.resolve({
            success: false,
            response: response
          });
        });
      });

      return deferred.promise;
    }
    //#endregion

    return returnObj;
  }
})(angular);

(function (angular, undefined) {
  'use strict';
  var storageKey = 'gsnStorage-';
  var fallbackStorage = {};

  /*jshint -W030 */
  angular.module('gsn.core').
      factory('$localStorage', createStorage('localStorage')).
      factory('$sessionStorage', createStorage('sessionStorage'));

  function createStorage(storageType) {
    return [
        '$rootScope',
        '$window',
        '$log',

        function (
            $rootScope,
            $window,
            $log
        ) {
          function isStorageSupported(storageType) {
            var supported = $window[storageType];

            // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
            // is available, but trying to call .setItem throws an exception below:
            // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
            if (supported && storageType === 'localStorage') {
              var key = '__' + Math.round(Math.random() * 1e7);

              try {
                localStorage.setItem(key, key);
                localStorage.removeItem(key);
              }
              catch (err) {
                supported = false;
              }
            }

            return supported;
          }

          // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
          var webStorage = isStorageSupported(storageType) || ($log.warn('This browser does not support Web Storage!'), fallbackStorage),
              $storage = {
                $default: function (items) {
                  for (var k in items) {
                    angular.isDefined($storage[k]) || ($storage[k] = items[k]);
                  }

                  return $storage;
                },
                $reset: function (items) {
                  for (var k in $storage) {
                    '$' === k[0] || delete $storage[k];
                  }

                  return $storage.$default(items);
                }
              },
              currentStorage,
              _debounce;

          for (var i = 0, k; i < webStorage.length; i++) {
            // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
            (k = webStorage.key(i)) && storageKey === k.slice(0, storageKey.length) && ($storage[k.slice(storageKey.length)] = angular.fromJson(webStorage.getItem(k)));
          }

          currentStorage = angular.copy($storage);

          $rootScope.$watch(function () {
            _debounce || (_debounce = setTimeout(function () {
              _debounce = null;

              if (!angular.equals($storage, currentStorage)) {
                angular.forEach($storage, function (v, k) {
                  angular.isDefined(v) && '$' !== k[0] && webStorage.setItem(storageKey + k, angular.toJson(v));

                  delete currentStorage[k];
                });

                for (var k in currentStorage) {
                  webStorage.removeItem(storageKey + k);
                }

                currentStorage = angular.copy($storage);
              }
            }, 100));
          });

          // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
          'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function (event) {
            if (storageKey === event.key.slice(0, storageKey.length)) {
              // hack to support older safari (iPad1 or when browsing in private mode)
              // this assume that gsnStorage should never set anything to null.  Empty object yes, no null.
              if (typeof (event.newValue) === 'undefined') return;

              event.newValue ? $storage[event.key.slice(storageKey.length)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(storageKey.length)];

              currentStorage = angular.copy($storage);

              $rootScope.$apply();
            }
          });

          return $storage;
        }
    ];
  }
})(angular);
(function(angular, undefined) {
  'use strict';
  var serviceId = 'gsnStore';
  angular.module('gsn.core').service(serviceId, ['$rootScope', '$http', 'gsnApi', '$q', '$timeout', '$location', gsnStore]);

  function gsnStore($rootScope, $http, gsnApi, $q, $timeout, $location) {
    var returnObj = {};

    $rootScope[serviceId] = returnObj;
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
    returnObj.getCircular = function(circularTypeId) {
      var result = _cp.circularByTypeId[circularTypeId];
      return result;
    };

    // get all categories
    returnObj.getCategories = function() {
      return _cp.categoryById;
    };

    // get inventory categories
    returnObj.getInventoryCategories = function() {
      var url = gsnApi.getStoreUrl() + '/GetInventoryCategories/' + gsnApi.getChainId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http({}, url);
    };

    // get sale item categories
    returnObj.getSaleItemCategories = function() {
      var url = gsnApi.getStoreUrl() + '/GetSaleItemCategories/' + gsnApi.getChainId() + '/' + gsnApi.getSelectedStoreId();
      return gsnApi.http({}, url);
    };

    // refresh current store circular
    returnObj.refreshCircular = function() {
      if (_lc.circularIsLoading) return;
      var config = gsnApi.getConfig();
      if (config.AllContent) {
        _lc.circularIsLoading = true;
        processCircularData(function() {
          _lc.circularIsLoading = false;
        });
        return;
      }

      _lc.storeId = gsnApi.getSelectedStoreId();
      if (_lc.storeId <= 0) return;

      _lc.circular = {};
      _lc.circularIsLoading = true;
      $rootScope.$broadcast("gsnevent:circular-loading");

      var url = gsnApi.getStoreUrl() + '/AllContent/' + _lc.storeId;
      gsnApi.http({}, url).then(function(rst) {
        if (rst.success) {
          _lc.circular = rst.response;
          betterStorage.circular = rst.response;

          // resolve is done inside of method below
          processCircularData();
          _lc.circularIsLoading = false;
        } else {
          _lc.circularIsLoading = false;
          $rootScope.$broadcast("gsnevent:circular-failed", rst);
        }
      });
    };


    returnObj.searchProducts = function(searchTerm) {
      var url = gsnApi.getStoreUrl() + '/SearchProduct/' + gsnApi.getSelectedStoreId() + '?q=' + encodeURIComponent(searchTerm);
      return gsnApi.http({}, url);
    };

    returnObj.searchRecipes = function(searchTerm) {
      var url = gsnApi.getStoreUrl() + '/SearchRecipe/' + gsnApi.getChainId() + '?q=' + encodeURIComponent(searchTerm);
      return gsnApi.http({}, url);
    };

    returnObj.getAvailableVarieties = function(circularItemId) {
      var url = gsnApi.getStoreUrl() + '/GetAvailableVarieties/' + circularItemId;
      return gsnApi.http({}, url);
    };

    returnObj.getQuickSearchItems = function() {
      var url = gsnApi.getStoreUrl() + '/GetQuickSearchItems/' + gsnApi.getChainId();
      return gsnApi.http(_lc.quickSearchItems, url);
    };

    // get all stores from cache
    returnObj.getStores = function() {
      var deferred = $q.defer();
      if (gsnApi.isNull(_lc.previousGetStore, null) !== null) {
        return _lc.previousGetStore.promise;
      }

      _lc.previousGetStore = deferred;
      var storeList = betterStorage.storeList;
      if (gsnApi.isNull(storeList, []).length > 0) {
        $timeout(function() {
          _lc.previousGetStore = null;
          parseStoreList(storeList);
          deferred.resolve({
            success: true,
            response: storeList
          });
        }, 10);
      } else {
        $rootScope.$broadcast("gsnevent:storelist-loading");
        gsnApi.getAccessToken().then(function() {
          var url = gsnApi.getStoreUrl() + '/List/' + gsnApi.getChainId();
          $http.get(url, {
            headers: gsnApi.getApiHeaders()
          }).success(function(response) {
            _lc.previousGetStore = null;
            var stores = response;
            parseStoreList(stores, true);
            deferred.resolve({
              success: true,
              response: stores
            });
            if (stores.length > 0) {
              $rootScope.$broadcast("gsnevent:storelist-loaded");
            }
          });
        });
      }

      return deferred.promise;
    };

    // get the current store
    returnObj.getStore = function() {
      var deferred = $q.defer();
      returnObj.getStores().then(function(rsp) {
        var data = gsnApi.mapObject(rsp.response, 'StoreId');
        var result = data[gsnApi.getSelectedStoreId()];
        deferred.resolve(result);
      });

      return deferred.promise;
    };

    // get item by id
    returnObj.getItem = function(id) {
      var result = _cp.itemsById[id];
      return (gsn.isNull(result, null) !== null) ? result : null;
    };

    returnObj.getAskTheChef = function() {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/1';
      return gsnApi.http(_lc.faAskTheChef, url);
    };

    returnObj.getFeaturedArticle = function() {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/2';
      return gsnApi.http(_lc.faArticle, url);
    };

    returnObj.getFeaturedVideo = function() {
      var url = gsnApi.getStoreUrl() + '/FeaturedVideo/' + gsnApi.getChainId();
      return gsnApi.http(_lc.faVideo, url);
    };

    returnObj.getRecipeVideos = function() {
      var url = gsnApi.getStoreUrl() + '/RecipeVideos/' + gsnApi.getChainId();
      return gsnApi.http(_lc.allVideos, url);
    };

    returnObj.getCookingTip = function() {
      var url = gsnApi.getStoreUrl() + '/FeaturedArticle/' + gsnApi.getChainId() + '/3';
      return gsnApi.http(_lc.faCookingTip, url);
    };

    returnObj.getTopRecipes = function() {
      var url = gsnApi.getStoreUrl() + '/TopRecipes/' + gsnApi.getChainId() + '/' + 50;
      return gsnApi.http(_lc.topRecipes, url);
    };

    returnObj.getFeaturedRecipe = function() {
      var url = gsnApi.getStoreUrl() + '/FeaturedRecipe/' + gsnApi.getChainId();
      return gsnApi.http(_lc.faRecipe, url);
    };

    returnObj.getCoupon = function(couponId, couponType) {
      return couponType == 2 ? _cp.manuCouponById[couponId] : (couponType == 10 ? _cp.storeCouponById[couponId] : _cp.youtechCouponById[couponId]);
    };

    returnObj.getManufacturerCoupons = function() {
      return _lc.manufacturerCoupons;
    };

    returnObj.getManufacturerCouponTotalSavings = function() {
      var url = gsnApi.getStoreUrl() + '/GetManufacturerCouponTotalSavings/' + gsnApi.getChainId();
      return gsnApi.http(_lc.manuCouponTotalSavings, url);
    };

    returnObj.getStates = function() {
      var url = gsnApi.getStoreUrl() + '/GetStates';
      return gsnApi.http(_lc.states, url);
    };

    returnObj.getInstoreCoupons = function() {
      return _lc.instoreCoupons;
    };

    returnObj.getYoutechCoupons = function() {
      return _lc.youtechCoupons;
    };

    returnObj.getRecipe = function(recipeId) {
      var url = gsnApi.getStoreUrl() + '/RecipeBy/' + recipeId;
      return gsnApi.http({}, url);
    };

    returnObj.getStaticContent = function(contentName) {
      var url = gsnApi.getStoreUrl() + '/GetPartials/' + gsnApi.getChainId() + '/';
      var storeId = gsnApi.isNull(gsnApi.getSelectedStoreId(), 0);
      if (storeId > 0) {
        url += storeId + '/';
      }
      url += '?name=' + encodeURIComponent(contentName);

      return gsnApi.http({}, url);
    };

    returnObj.getPartial = function(contentName) {
      if (!contentName) {
        contentName = "Home Page";
      }

      var url = gsnApi.getContentServiceUrl('GetPartial');
      var today = new Date();
      var nocache = today.getFullYear() + '' + today.getMonth() + '' + today.getDate() + '' + today.getHours();
      url += '?name=' + encodeURIComponent(contentName) + '&nocache=' + nocache;

      return gsnApi.http({}, url);
    };

    returnObj.getArticle = function(articleId) {
      var url = gsnApi.getStoreUrl() + '/ArticleBy/' + articleId;
      return gsnApi.http({}, url);
    };

    returnObj.getSaleItems = function(departmentId, categoryId) {
      var url = gsnApi.getStoreUrl() + '/FilterSaleItem/' + gsnApi.getSelectedStoreId() + '?' + 'departmentId=' + gsnApi.isNull(departmentId, '') + '&categoryId=' + gsnApi.isNull(categoryId, '');
      return gsnApi.http({}, url);
    };

    returnObj.getInventory = function(departmentId, categoryId) {
      var url = gsnApi.getStoreUrl() + '/FilterInventory/' + gsnApi.getSelectedStoreId() + '?' + 'departmentId=' + gsnApi.isNull(departmentId, '') + '&categoryId=' + gsnApi.isNull(categoryId, '');
      return gsnApi.http({}, url);
    };

    returnObj.getSpecialAttributes = function() {
      var url = gsnApi.getStoreUrl() + '/GetSpecialAttributes/' + gsnApi.getChainId();
      return gsnApi.http(_lc.specialAttributes, url);
    };

    returnObj.getMealPlannerRecipes = function() {
      var url = gsnApi.getStoreUrl() + '/GetMealPlannerRecipes/' + gsnApi.getChainId();
      return gsnApi.http(_lc.mealPlanners, url);
    };

    returnObj.getAdPods = function() {
      var url = gsnApi.getStoreUrl() + '/ListSlots/' + gsnApi.getChainId();
      return gsnApi.http(_lc.adPods, url);
    };

    returnObj.hasCompleteCircular = function() {
      var circ = returnObj.getCircularData();
      var result = false;

      if (circ) {
        result = gsnApi.isNull(circ.Circulars, false);
      }

      if (!result && (gsnApi.isNull(gsnApi.getSelectedStoreId(), 0) > 0)) {
        returnObj.refreshCircular();
        result = false;
      }

      return returnObj.getProcessDate() ? result : null;
    };

    returnObj.getProcessDate = function() {
      return _cp.processCompleted;
    };

    returnObj.getCircularData = function(forProcessing) {
      if (!_lc.circular) {
        _lc.circular = betterStorage.circular;
        if (!forProcessing) {
          processCircularData();
        }
      }

      return _lc.circular;
    };

    returnObj.initialize = function(isApi) {
      /// <summary>Initialze store data. this method should be
      /// written such that, it should do a server retrieval when parameter is null.
      /// </summary>

      gsnApi.initApp();

      // call api to get stores
      var config = gsnApi.getConfig();
      var rawStoreList = config.StoreList;
      if (rawStoreList) {
        parseStoreList(rawStoreList, true);
      }

      returnObj.getStores();
      if (config.AllContent) {
        config.AllContent.Circularz = config.AllContent.Circulars;
        config.AllContent.Circulars = [];
        angular.forEach(config.AllContent.Circularz, function(circ) {
          circ.Pagez = circ.Pages;
          circ.Pages = [];
        });

        betterStorage.circular = config.AllContent;
      }

      if (returnObj.hasCompleteCircular()) {
        // async init data
        $timeout(processCircularData, 0);
      }

      if (gsnApi.isNull(isApi, null) !== null) {
        returnObj.getAdPods();
        returnObj.getManufacturerCouponTotalSavings();
      }
    };

    $rootScope.$on('gsnevent:store-setid', function(event, values) {
      var storeId = values.newValue;
      var config = gsnApi.getConfig();
      var hasNewStoreId = (gsnApi.isNull(_lc.storeId, 0) != storeId);
      var requireRefresh = hasNewStoreId && !config.AllContent;

      // attempt to load circular
      if (hasNewStoreId) {
        _lc.storeId = storeId;
        _lc.circularIsLoading = false;
      }

      // always call update circular on set storeId or if it has been more than 20 minutes
      var currentTime = new Date().getTime();
      var seconds = (currentTime - gsnApi.isNull(betterStorage.circularLastUpdate, 0)) / 1000;
      if ((requireRefresh && !_lc.circularIsLoading) || (seconds > 1200)) {
        returnObj.refreshCircular();
      } else if (hasNewStoreId) {
        processCircularData();
      }
    });

    return returnObj;

    //#region helper methods
    function parseStoreList(storeList, isRaw) {
      if (isRaw) {
        var stores = storeList;
        if (typeof (stores) != "string") {
          angular.forEach(stores, function(store) {
            store.Settings = gsnApi.mapObject(store.StoreSettings, 'StoreSettingId');
          });

          betterStorage.storeList = stores;
        }
      }
      var search = $location.search();
      var selectFirstStore = search.sfs || search.selectFirstStore || search.selectfirststore;
      storeList = gsnApi.isNull(storeList, []);
      if (storeList.length == 1 || selectFirstStore) {
        if (storeList[0].StoreId != gsnApi.isNull(gsnApi.getSelectedStoreId(), 0)) {
          gsnApi.setSelectedStoreId(storeList[0].StoreId);
        }
      } else if (search.storeid) {
        var storeById = gsnApi.mapObject(storeList, 'StoreId');
        gsnApi.setSelectedStoreId(storeById[search.storeid].StoreId);
      } else if (search.storenbr) {
        var storeByNumber = gsnApi.mapObject(storeList, 'StoreNumber');
        gsnApi.setSelectedStoreId(storeByNumber[search.storenbr].StoreId);
      } else if (search.store) {
        var storeByUrl = gsnApi.mapObject(storeList, 'StoreUrl');
        if (storeByNumber[search.store]) {
          gsnApi.setSelectedStoreId(storeByNumber[search.store].StoreId);
        }
      }
    }

    function processManufacturerCoupon() {
      if (gsnApi.isNull(_lc.manufacturerCoupons.items, []).length > 0) return;

      // process manufacturer coupon
      var circular = returnObj.getCircularData();
      _lc.manufacturerCoupons.items = circular.ManufacturerCoupons;
      angular.forEach(_lc.manufacturerCoupons.items, function(item) {
        item.CategoryName = gsnApi.isNull(_cp.categoryById[item.CategoryId], {
          CategoryName: ''
        }).CategoryName;
        _cp.manuCouponById[item.ItemId] = item;
      });
      gsnApi.getConfig().hasPrintableCoupon = _lc.manufacturerCoupons.items.length > 0;
    }

    function processInstoreCoupon() {
      var circular = returnObj.getCircularData();
      // process in-store coupon
      var items = [];
      angular.forEach(circular.InstoreCoupons, function(item) {
        if (item.StoreIds.length <= 0 || item.StoreIds.indexOf(_lc.storeId) >= 0) {
          item.CategoryName = gsnApi.isNull(_cp.categoryById[item.CategoryId], {
            CategoryName: ''
          }).CategoryName;
          _cp.storeCouponById[item.ItemId] = item;
          items.push(item);
        }
      });

      gsnApi.getConfig().hasStoreCoupon = items.length > 0;

      _lc.instoreCoupons.items = items;
    }

    function processYoutechCoupon() {
      if (gsnApi.isNull(_lc.youtechCoupons.items, []).length > 0) return;

      var circular = returnObj.getCircularData();

      // process youtech coupon
      _lc.youtechCoupons.items = circular.YoutechCoupons;
      angular.forEach(_lc.youtechCoupons.items, function(item) {
        item.CategoryName = gsnApi.isNull(_cp.categoryById[item.CategoryId], {
          CategoryName: ''
        }).CategoryName;
        _cp.youtechCouponById[item.ItemId] = item;
      });

      gsnApi.getConfig().hasDigitalCoupon = _lc.youtechCoupons.items.length > 0;
    }

    function processCoupon() {
      if (_cp) {
        $timeout(processManufacturerCoupon, 50);
        $timeout(processInstoreCoupon, 50);
        $timeout(processYoutechCoupon, 50);
      }
    }

    function processCircularData(cb) {
      var circularData = returnObj.getCircularData(true);
      if (!circularData) return;
      if (!circularData.CircularTypes) return;

      betterStorage.circularLastUpdate = new Date().getTime();
      _lc.storeId = gsnApi.getSelectedStoreId();
      processingQueue.length = 0;

      // process category into key value pair
      processingQueue.push(function() {
        if (_cp.lastProcessDate == (new Date().getDate()) && _cp.categoryById[-1]) return;

        var categoryById = gsnApi.mapObject(circularData.Categories, 'CategoryId');

        categoryById[null] = {
          CategoryId: null,
          CategoryName: ''
        };
        categoryById[-1] = {
          CategoryId: -1,
          CategoryName: 'Misc. Items'
        };
        categoryById[-2] = {
          CategoryId: -2,
          CategoryName: 'Ingredients'
        };
        _cp.categoryById = categoryById;

        return;
      });

      var circularTypes = gsnApi.mapObject(circularData.CircularTypes, 'Code');
      var circularByTypes = [];
      var staticCirculars = [];
      var items = [];
      var circulars = gsnApi.isNull(circularData.Circularz, circularData.Circulars);
      circularData.Circulars = [];

      // foreach Circular
      angular.forEach(circulars, function(circ) {
        circ.StoreIds = circ.StoreIds || [];
        circ.CircularTypeName = (circularTypes[circ.CircularTypeId] || {}).Name;
        if (circ.StoreIds.length <= 0 || circ.StoreIds.indexOf(_lc.storeId) >= 0) {
          circularData.Circulars.push(circ);
          if (!circ.Pagez) {
            circ.Pagez = circ.Pages;
          }

          var pages = circ.Pagez;
          circ.Pages = [];

          angular.forEach(pages, function(page) {
            if (page.StoreIds.length <= 0 || page.StoreIds.indexOf(_lc.storeId) >= 0) {
              circ.Pages.push(page);
            }
          });

          processCircular(circ, items, circularTypes, staticCirculars, circularByTypes);
        }
      });

      processingQueue.push(function() {
        // set all items
        circularByTypes.push({
          CircularTypeId: 99,
          CircularType: 'All Circulars',
          items: items
        });

        // sort by circulartypeid
        gsnApi.sortOn(circularData.Circulars, 'CircularTypeId');
        return;
      });

      // set result
      processingQueue.push(function() {
        _cp.itemsById = gsnApi.mapObject(items, 'ItemId');
        return;
      });

      processingQueue.push(function() {
        _cp.circularByTypeId = gsnApi.mapObject(circularByTypes, 'CircularTypeId');
        return;
      });

      processingQueue.push(function() {
        _cp.staticCircularById = gsnApi.mapObject(staticCirculars, 'CircularTypeId');
        return;
      });

      processingQueue.push(processCoupon);

      processingQueue.push(function() {
        if (cb) cb();
        _cp.lastProcessDate = new Date().getDate();
        $rootScope.$broadcast('gsnevent:circular-loaded', {
          success: true,
          response: circularData
        });
        return;
      });

      processWorkQueue();
    }

    function processWorkQueue() {
      if (processingQueue.length > 0) {
        // this make sure that work get executed in sequential order
        processingQueue.shift()();

        $timeout(processWorkQueue, 50);
        return;
      }
      _cp.processCompleted = new Date();
	  $rootScope.$broadcast('gsnevent:circular-processed');
    }

    function processCircular(circ, items, circularTypes, staticCirculars, circularByTypes) {
      // process pages
      var pages = circ.Pages;
      var itemCount = 0;
      gsnApi.sortOn(pages, 'PageNumber');
      circ.pages = pages;
      circ.CircularType = circularTypes[circ.CircularTypeId].Name;
      circ.ImageUrl = gsnApi.isNull(circ.ImageUrl, {}).replace('http://', '//');
      var circularMaster = {
        CircularPageId: pages[0].CircularPageId,
        CircularType: circ.CircularType,
        CircularTypeId: circ.CircularTypeId,
        ImageUrl: pages[0].ImageUrl.replace('http://', '//'),
        SmallImageUrl: pages[0].SmallImageUrl.replace('http://', '//'),
        items: []
      };

      // foreach Page in Circular
      angular.forEach(pages, function(page) {
        //var pageCopy = {};
        //angular.extend(pageCopy, page);
        //pageCopy.Items = [];
        itemCount += page.Items.length;
        page.Circular = circ;
        page.ImageUrl = page.ImageUrl.replace('http://', '//');
        page.SmallImageUrl = page.SmallImageUrl.replace('http://', '//');

        processingQueue.push(function() {
          processCircularPage(items, circularMaster, page);
        });
      });

      processingQueue.push(function() {
        if (gsnApi.isNull(itemCount, 0) > 0) {
          circularByTypes.push(circularMaster);
        } else {
          circularMaster.items = pages;
          staticCirculars.push(circularMaster);
        }
      });
    }

    function processCircularPage(items, circularMaster, page) {
      angular.forEach(page.Items, function(item) {
        item.PageNumber = parseInt(page.PageNumber);
        item.rect = {
          x: 0,
          y: 0
        };
        var pos = (item.AreaCoordinates + '').split(',');
        if (pos.length > 2) {
          var temp = 0;
          for (var i = 0; i < 4; i++) {
            pos[i] = parseInt(pos[i]) || 0;
          }
          // swap if bad position
          if (pos[0] > pos[2]) {
            temp = pos[0];
            pos[0] = pos[2];
            pos[2] = temp;
          }
          if (pos[1] > pos[3]) {
            temp = pos[1];
            pos[1] = pos[3];
            pos[3] = temp;
          }

          item.rect.x = pos[0];
          item.rect.y = pos[1];
          item.rect.xx = pos[2];
          item.rect.yy = pos[3];
          item.rect.width = pos[2] - pos[0]; // width
          item.rect.height = pos[3] - pos[1]; // height
          item.rect.cx = item.rect.width / 2; // center
          item.rect.cy = item.rect.height / 2;
        }

        circularMaster.items.push(item);
        item.ImageUrl = item.ImageUrl.replace('http://', '//');
        item.SmallImageUrl = item.ImageUrl.replace('upload.gsngrocers.com/', 'upload.brickinc.net/').replace('upload.brickinc.net/', 'cdn2.brickinc.net/rx/120/up/');
        item.Quantity = item.Quantity || 1;
        items.push(item);
      });
    }
  //#endregion
  }
})(angular);

(function (angular, undefined) {
    'use strict';
    var serviceId = 'gsnYoutech';
    angular.module('gsn.core').service(serviceId, ['$rootScope', 'gsnApi', 'gsnProfile', 'gsnStore', '$q', '$http', gsnYoutech]);

    function gsnYoutech($rootScope, gsnApi, gsnProfile, gsnStore, $q, $http) {
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
        $rootScope[serviceId] = service;
        $rootScope.$on('gsnevent:logout', function (event, result) {
            if (!service.enable) {
                return;
            }
            $saveData = initData();
        });
        $rootScope.$on('gsnevent:profile-load-success', function (event, result) {
            if (!service.enable) {
                return;
            }
            initData();
            if ($saveData.youtechCouponUrl.length > 2) {
                //    - When profile change occurred, make call to get any available coupon for card
                $saveData.currentProfile = result.response;
                loadCardCoupon();
            }
        });
        $rootScope.$on('gsnevent:store-persisted', function (event, result) {
            if (!service.enable) {
                return;
            }
            initData();
            if ($saveData.currentProfile && $saveData.youtechCouponUrl.length > 2) {
                loadCardCoupon();
            }
        });
        return service;
        //#region Internal Methods
        function initData() {
            return {
                youtechCouponUrl: gsnApi.isNull(gsnApi.getYoutechCouponUrl(), ''),
                cardCouponResponse: null,
                availableCouponById: {},
                takenCouponById: {},
                redeemedCouponById: {},
                isValidResponse: false,
                currentProfile: {}
            };
        }

        function hasCard() {
            return (gsnApi.isNull($saveData.currentProfile.ExternalId, '').length > 0);
        }

        function hasValidCard() {
            return hasCard() && $saveData.isValidResponse;
        }

        function isValidCoupon(couponId) {
            var isValid = (isAvailable(couponId) || isOnCard(couponId));
            return isValid;
        }

        function isAvailable(couponId) {
            return (gsnApi.isNull($saveData.availableCouponById[couponId], null) !== null);
        }

        function isOnCard(couponId) {
            return (gsnApi.isNull($saveData.takenCouponById[couponId], null) !== null);
        }

        function hasRedeemed(couponId) {
            return (gsnApi.isNull($saveData.redeemedCouponById[couponId], null) !== null);
        }

        function handleFailureEvent(eventName, deferred, couponId, response) {
            deferred.resolve({
                success: false,
                response: response
            });
            $rootScope.$broadcast(eventName, couponId);
        }

        function addCouponToCard(couponId) {
            var deferred = $q.defer();
            gsnApi.getAccessToken().then(function () {
                var url = $saveData.youtechCouponUrl + '/AddToCard/' + gsnApi.getProfileId() + '/' + couponId;
                $http.post(url, {}, {
                    headers: gsnApi.getApiHeaders()
                }).success(function (response) {
                    if (response.Success) {
                        $saveData.takenCouponById[couponId] = true;
                        $saveData.availableCouponById[couponId] = null;
                        deferred.resolve({
                            success: response.Success,
                            response: response
                        });
                        $rootScope.$broadcast('gsnevent:youtech-cardcoupon-added', couponId);
                    } else {
                        handleFailureEvent('gsnevent:youtech-cardcoupon-addedfail', deferred, couponId, response.Message);
                    }
                }).error(function (response) {
                    handleFailureEvent('gsnevent:youtech-cardcoupon-addfail', deferred, couponId, response);
                });
            });
            return deferred.promise;
        }

        function removeCouponFromCard(couponId) {
            var deferred = $q.defer();
            gsnApi.getAccessToken().then(function () {
                var url = $saveData.youtechCouponUrl + '/RemoveFromCard/' + gsnApi.getProfileId() + '/' + couponId;
                $http.post(url, {}, {
                    headers: gsnApi.getApiHeaders()
                }).success(function (response) {
                    if (response.Success) {
                        $saveData.availableCouponById[couponId] = true;
                        $saveData.takenCouponById[couponId] = null;
                        deferred.resolve({
                            success: response.Success,
                            response: response
                        });
                        $rootScope.$broadcast('gsnevent:youtech-cardcoupon-removed', couponId);
                    } else {
                        handleFailureEvent('gsnevent:youtech-cardcoupon-removefail', deferred, couponId, response.Message);
                    }
                }).error(function (response) {
                    handleFailureEvent('gsnevent:youtech-cardcoupon-removefail', deferred, couponId, response);
                });
            });
            return deferred.promise;
        }

        function loadCardCoupon() {
            gsnApi.getAccessToken().then(function () {
                var url = $saveData.youtechCouponUrl + '/GetProfileCoupons/' + gsnApi.getProfileId();
                $http.get(url, {
                    headers: gsnApi.getApiHeaders()
                }).success(function (response) {
                    // process card coupon response
                    if (response.Success) {
                        var i = 0;
                        $saveData.isValidResponse = true;
                        try {
                            $saveData.cardCouponResponse = response.Response;
                            if ($saveData.cardCouponResponse.availableCoupons) {
                                $saveData.availableCouponById = gsnApi.mapObject($saveData.cardCouponResponse.availableCoupons.coupon, 'couponId');
                            }
                            if ($saveData.cardCouponResponse.available_ids) {
                                $saveData.availableCouponById = {};
                                for (i = 0; i < $saveData.cardCouponResponse.available_ids.length; i++) {
                                    $saveData.availableCouponById[$saveData.cardCouponResponse.available_ids[i]] = true;
                                }
                            }
                            if ($saveData.cardCouponResponse.takenCoupons) {
                                $saveData.takenCouponById = gsnApi.mapObject($saveData.cardCouponResponse.takenCoupons.coupon, 'couponId');
                            }
                            var toParse = gsnApi.isNull($saveData.cardCouponResponse.taken_ids, $saveData.cardCouponResponse.clipped_active_ids);
                            if (toParse) {
                                $saveData.takenCouponById = {};
                                for (i = 0; i < toParse.length; i++) {
                                    $saveData.takenCouponById[toParse[i]] = true;
                                }
                            }
                            // add clipped_redeemed_ids
                            toParse = $saveData.cardCouponResponse.clipped_redeemed_ids;
                            if (toParse) {
                                $saveData.redeemedCouponById = {};
                                for (i = 0; i < toParse.length; i++) {
                                    $saveData.takenCouponById[toParse[i]] = true;
                                    $saveData.redeemedCouponById[toParse[i]] = true;
                                }
                            }
                        } catch (e) {}
                        $rootScope.$broadcast('gsnevent:youtech-cardcoupon-loaded', service);
                        return;
                    }
                    $saveData = initData();
                    $rootScope.$broadcast('gsnevent:youtech-cardcoupon-loadfail', service);
                }).error(function (response) {
                    $saveData.isValidResponse = false;
                    $rootScope.$broadcast('gsnevent:youtech-cardcoupon-loadfail', service);
                });
            });
        }
        //#endregion
    }
})(angular);

(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('defaultIf', ['gsnApi', function (gsnApi) {
    // Usage: testValue | defaultIf:testValue == 'test' 
    //    or: testValue | defaultIf:someTest():defaultValue
    //

    return function (input, conditional, defaultOrFalseValue) {
      var localCondition = conditional;
      if (typeof(conditional) == "function") {
        localCondition = conditional();
      }
      return localCondition ? defaultOrFalseValue : input;
    };
  }]);

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('groupBy', ['gsnApi', function (gsnApi) {
    // Usage: for doing grouping
    // 

    return function (input, attribute) {
      return gsnApi.groupBy(input, attribute);
    };
  }]);

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('pagingFilter', function () {
    // Usage: for doing paging, item in list | pagingFilter:2:1
    // 

    return function (input, pageSize, currentPage) {
      return input ? input.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : [];
    };
  });

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('tel', function () {
    // Usage: phone number formating phoneNumber | tel
    // 
    return function (tel, format, regex) {
      if (!tel) return '';

      regex = regex ? new RegEx(regex) : /(\d{3})(\d{3})(\d{4})/;
      var value = (""+tel).replace(/\D/g, '');  
      
      return  value.replace(regex, format || "$1-$2-$3");
    };
  });

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  /**
  * This directive help dynamically create a list of numbers.
  * usage: data-ng-repeat="n in [] | range:1:5"
  * @directive range
  */
  myModule.filter('range', [function () {
    return function (input, min, max) {
      min = parseInt(min); //Make string input int
      max = parseInt(max);
      for (var i = min; i < max; i++) {
        input.push(i);
      }

      return input;
    };
  }]);

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('removeAspx', ['gsnApi', function (gsnApi) {
    // Usage: for removing aspx
    // 

    return function (text) {
      return gsnApi.isNull(text, '').replace(/(.aspx\"|.gsn\")+/gi, '"');
    };
  }]);

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('replaceWith', function() {
    // Usage: testValue | replaceWith:'\\s+':'gi':' ' 
    // 
    return function(input, regex, flag, replaceWith) {
      var patt = new RegExp(regex, flag);      
     
      return input.replace(patt, replaceWith);
    };
  });
})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('truncate', [function () {
    /**
     * {{some_text | truncate:true:100:' ...'}}
     * @param  {string}  value    the original text
     * @param  {boolean} wordwise true to split by word
     * @param  {integer} max      max character or word
     * @param  {string}  tail     ending characters
     * @return {string}          
     */
    return function (value, wordwise, max, tail) {
      if (!value) return '';

      max = parseInt(max, 10);
      if (!max) return value;
      if (value.length <= max) return value;

      value = value.substr(0, max);
      if (wordwise) {
        var lastspace = value.lastIndexOf(' ');
        if (lastspace != -1) {
          value = value.substr(0, lastspace);
        }
      }

      return value + (tail || ' …');
    };
  }]);

})(angular);

(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('trustedHtml', ['gsnApi', '$sce', function (gsnApi, $sce) {
    // Usage: allow for binding html
    // 
    return function (text) {
      return $sce.trustAsHtml(text);
    };
  }]);

})(angular);
(function (angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.filter('unescapeHtml', [function () {
    // Usage: allow for escaping html
    // 
    return function (text, escape) {
      return escape ? escape(text) : unescape(text);
    };
  }]);

})(angular);