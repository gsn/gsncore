(function() {
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
    ShoppingListServiceUrl: '/proxy/shoppinglisttwo',
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
    GoogleAnalyticAccountId1: null,
    RegistrationFromEmailAddress: 'tech@grocerywebsites.com',
    RegistrationEmailLogo: null,
    FacebookAppId: null,
    FacebookPermission: null,
    Theme: null,
    HomePage: null,
    StoreList: null,
    AllContent: null,
    hasStoreCoupon: false,
    hasInit: false,
    isPrerender: /Prerender/.test(root.navigator.userAgent)
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
  };

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
      if (typeof(source) !== 'undefined') {
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
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) !== -1;
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
      if (typeof(siteMenu) === 'string') {
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
      var androidversion = parseFloat(ua.slice(ua.indexOf('Android"') + 8));

      if (androidversion > 4) {
        return;
      }

      useProxy = false;
    }

    // if not useProxy, replace proxy with valid api url
    if (!useProxy) {
      gsn.forEach(gsn.config, function(v, k) {
        if (typeof(v) !== 'string' || v === 'ApiUrl') return;
        if (v.indexOf('/proxy/') >= 0) {
          gsn.config[k] = v.replace('/proxy/', gsn.config.ApiUrl + '/');
        }
      });
    }

    config.useProxy = useProxy;
  };

  // return defaultValue if null
  gsn.isNull = function(obj, defaultValue) {
    return (typeof(obj) === 'undefined' || obj === null || obj === 'null') ? defaultValue : obj;
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
    if (typeof(collection[0][name]) === 'string') {
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
      delete obj[key];
    } catch (e) {
      var items = {};
      gsn.each(obj, function(v, k) {
        if (k !== key)
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
    return gsn.getApiUrl() + '/Content' + gsn.isNull(url, '');
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
    if (gsn.config.isPrerender) return;

    // GA already supports buffered invocations so we don't need
    // to wrap these inside angulartics.waitForVendorApi
    if ($analyticsProvider.settings) {
      $analyticsProvider.settings.trackRelativePath = true;
    }

    // GA already supports buffered invocations so we don't need
    // to wrap these inside angulartics.waitForVendorApi
    $analyticsProvider.registerPageTrack(function(path) {
      var dataLayer = root.dataLayer || [];
      // use gtag logic allow pushing data to both gtag and GTM
      var gtag = root.gtag || function () {dataLayer.push(arguments);};

      gtag('config', gsn.config.GoogleAnalyticAccountId1, {
        'page_path': path
      });

      // send to all classic analytic named trackers
      if (typeof (root.ga) !== 'undefined' && root.ga.getAll) {
        var trackers = root.ga.getAll();

        gsn.forEach(trackers, function(tracker) {
          root.ga(tracker.get('name') + '.send', 'pageview', path);
        });
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

      var evt = properties;
      var dataLayer = root.dataLayer || [];
      // use gtag logic allow pushing data to both gtag and GTM
      var gtag = root.gtag || function () {dataLayer.push(arguments);};

      gtag('event', action, {
        'event_category': evt.category,
        'event_label': evt.label,
        'value': evt.value
      });

      // send to all classic analytic named trackers
      if (typeof (root.ga) !== 'undefined' && root.ga.getAll) {
        var trackers = root.ga.getAll();

        gsn.forEach(trackers, function(tracker) {
          root.ga(tracker.get('name') + '.send', 'event', evt.category, action, evt.label, evt.value);
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
    gsn.config.ContentBaseUrl = root.location.port > 1000 && root.location.port < 5000 ? '/asset/' + gsn.config.ChainId : gsn.config.ContentBaseUrl;
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
      'file:///**'
    ]);


    //gets rid of the /#/ in the url and allows things like 'bootstrap collapse' to function
    if (typeof($locationProvider) !== 'undefined') {
      $locationProvider.html5Mode(true).hashPrefix('!');
    }

    if (typeof($httpProvider) !== 'undefined') {
      $httpProvider.interceptors.push('gsnAuthenticationHandler');

      // Enable cross domain calls
      $httpProvider.defaults.useXDomain = true;

      // Remove the header used to identify ajax call  that would prevent CORS from working
      $httpProvider.defaults.headers.common['X-Requested-With'] = null;
    }

    if (typeof(root.FastClick) !== 'undefined') {
      root.FastClick.attach(document.body);
    }

    if (typeof(FacebookProvider) !== 'undefined') {
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
      } else {
        FacebookProvider.init(gsn.config.FacebookAppId, false);
      }
    }
  };
  //#endregion

  if (root.globalConfig) {
    gsn.config.ApiUrl = gsn.isNull(root.globalConfig.apiUrl, '').replace(/\/+$/g, '');
    if (gsn.config.ApiUrl === '') {
      gsn.config.ApiUrl = '/proxy';
    }
  }

  //#region dynamic script loader
  function loadSingleScript(uri, callbackFunc) {
    if (uri.indexOf('//') < 0) {
      uri = 'http:' + uri;
    }

    // Prefix protocol
    if ((root.location || {}).protocol === 'file') {
      uri = uri.replace('https://', 'http://');
    }

    var tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.src = uri;

    function maybeDone() {
      if (typeof(tag.readyState) === 'undefined' || tag.readyState === 'complete') {
        // Pull the tags out based on the actual element in case IE ever
        // intermingles the onload and onreadystatechange handlers for the same
        // script block before notifying for another one.
        if (typeof(callbackFunc) === 'function') callbackFunc();
      }
    }

    if (callbackFunc) {
      tag.onload = maybeDone;
      tag.onreadystatechange = maybeDone; // For IE8-
    }

    document.body.appendChild(tag);
  }

  gsn.loadScripts = function(uris, callbackFunc) {
    if (gsn.isNull(uris.length, 0) <= 0) {
      if (typeof(callbackFunc) === 'function') {
        callbackFunc();
      }
    } else {
      if (typeof(uris) === 'string') {
        uris = [uris];
      }

      var toProcess = [].concat(uris);

      var processNext = function() {
        if (toProcess.length <= 0) {
          if (typeof(callbackFunc) === 'function') {
            callbackFunc();
          }
        } else {
          var item = toProcess[0];
          toProcess.splice(0, 1);
          loadSingleScript(item, processNext);
        }
      };

      processNext();
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
        result.ContentList = gsn.sortOn(contentList, 'SortBy');
      }
    }

    result.ConfigData = result.ConfigData || {};
    result.ContentData = result.ContentData || {};
    result.ContentList = result.ContentList || [];

    return result;
  };
}).call(this);
