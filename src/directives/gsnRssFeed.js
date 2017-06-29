( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnRssFeed', [ 'FeedService', '$timeout', function ( FeedService, $timeout ) {
    // Usage:   bind rss feed to some property
    //
    // Creates: 2014-01-06
    //
    var directive = {
      link: link,
      restrict: 'A'
    };
    return directive;

    function link( scope, element, attrs ) {
      FeedService.parseFeed( attrs.gsnRssFeed, attrs.maxResult ).then( function ( res ) {
        scope[ attrs.ngModel ] = res.data.responseData.feed;
      } );
    }
  } ] );
} )( angular );
