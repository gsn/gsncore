( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnFlowPlayer', [ '$timeout', 'gsnApi', '$rootScope', '$routeParams', function ( $timeout, gsnApi, $rootScope, $routeParams ) {
    // Usage: add 3rd party videos
    //
    // Creates: 2013-12-12 TomN
    //
    var directive = {
      restrict: 'EA',
      replace: true,
      scope: true,
      link: link
    };
    return directive;

    function link( scope, element, attrs ) {

      scope.play = function ( url, title ) {

        scope.videoTitle = title;
        scope.videoName = name;

        flowplayer( attrs.gsnFlowPlayer, attrs.swf, {
          clip: {
            url: url,
            autoPlay: true,
            autoBuffering: true // <- do not place a comma here
          }
        } );

        $rootScope.$broadcast( 'gsnevent:loadads' );
      };

      if ( $routeParams.title ) {
        scope.videoTitle = $routeParams.title;
      }

      $timeout( function () {
        var el = angular.element( 'a[title="' + scope.vm.featuredVideo.Title + '"]' );
        el.click();
      }, 500 );
    }
  } ] );
} )( angular );
