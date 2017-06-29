( function ( angular, undefined ) {
  'use strict';
  var storageKey = 'gsnStorage-';
  var fallbackStorage = {};

  /*jshint -W030 */
  angular.module( 'gsn.core' ).
  factory( '$localStorage', createStorage( 'localStorage' ) ).
  factory( '$sessionStorage', createStorage( 'sessionStorage' ) );

  function createStorage( storageType ) {
    return [
        '$rootScope',
        '$window',
        '$log',

        function (
        $rootScope,
        $window,
        $log
        ) {
        function isStorageSupported( storageType ) {
          var supported = $window[ storageType ];

          // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
          // is available, but trying to call .setItem throws an exception below:
          // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
          if ( supported && storageType === 'localStorage' ) {
            var key = '__' + Math.round( Math.random() * 1e7 );

            try {
              localStorage.setItem( key, key );
              localStorage.removeItem( key );
            } catch ( err ) {
              supported = false;
            }
          }

          return supported;
        }

        // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
        var webStorage = isStorageSupported( storageType ) || ( $log.warn( 'This browser does not support Web Storage!' ), fallbackStorage ),
          $storage = {
            $default: function ( items ) {
              for ( var k in items ) {
                angular.isDefined( $storage[ k ] ) || ( $storage[ k ] = items[ k ] );
              }

              return $storage;
            },
            $reset: function ( items ) {
              for ( var k in $storage ) {
                '$' === k[ 0 ] || delete $storage[ k ];
              }

              return $storage.$default( items );
            }
          },
          currentStorage,
          _debounce;

        for ( var i = 0, k; i < webStorage.length; i++ ) {
          // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
          ( k = webStorage.key( i ) ) && storageKey === k.slice( 0, storageKey.length ) && ( $storage[ k.slice( storageKey.length ) ] = angular.fromJson( webStorage.getItem( k ) ) );
        }

        currentStorage = angular.copy( $storage );

        $rootScope.$watch( function () {
          _debounce || ( _debounce = setTimeout( function () {
            _debounce = null;

            if ( !angular.equals( $storage, currentStorage ) ) {
              angular.forEach( $storage, function ( v, k ) {
                angular.isDefined( v ) && '$' !== k[ 0 ] && webStorage.setItem( storageKey + k, angular.toJson( v ) );

                delete currentStorage[ k ];
              } );

              for ( var k in currentStorage ) {
                webStorage.removeItem( storageKey + k );
              }

              currentStorage = angular.copy( $storage );
            }
          }, 100 ) );
        } );

        // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
        'localStorage' === storageType && $window.addEventListener && $window.addEventListener( 'storage', function ( event ) {
          if ( storageKey === event.key.slice( 0, storageKey.length ) ) {
            // hack to support older safari (iPad1 or when browsing in private mode)
            // this assume that gsnStorage should never set anything to null.  Empty object yes, no null.
            if ( typeof ( event.newValue ) === 'undefined' ) return;

            event.newValue ? $storage[ event.key.slice( storageKey.length ) ] = angular.fromJson( event.newValue ) : delete $storage[ event.key.slice( storageKey.length ) ];

            currentStorage = angular.copy( $storage );

            $rootScope.$apply();
          }
        } );

        return $storage;
        }
    ];
  }
} )( angular );
