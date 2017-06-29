( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnFrame', [ '$interpolate', '$http', '$templateCache', 'gsnApi', function ( $interpolate, $http, $templateCache, gsnApi ) {
    // Usage: add static content frame
    //
    // Creates: 2013-12-12 TomN
    //
    var directive = {
      restrict: 'A',
      scope: {
        item: '='
      },
      link: link
    };
    return directive;

    function link( scope, elm, attrs ) {

      var templateUrl = gsnApi.getThemeUrl( attrs.gsnFrame );
      var templateLoader = $http.get( templateUrl, {
        cache: $templateCache
      } );
      scope.templateHtml = '';

      templateLoader.success( function ( html ) {
        scope.templateHtml = html;
      } ).then( function ( response ) {
        var html = $interpolate( scope.templateHtml )( scope.item );
        html = html.replace( '<title></title>', '<title>' + scope.item.Title + '</title>' );
        html = html.replace( '<body></body>', '<body>' + scope.item.Description + '</body>' );
        var iframe = gsnApi.loadIframe( elm, html );
        iframe.setAttribute( 'width', '100%' );
        iframe.setAttribute( 'frameborder', '0' );
        iframe.setAttribute( 'scrolling', 'no' );
        iframe.setAttribute( 'id', 'static-content-frame' );
      } );
    }
  } ] );
} )( angular );
