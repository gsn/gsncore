( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnCouponPopover', [ '$window', function ( $window ) {

    var directive = {
      restrict: 'EA',
      scope: true,
      link: link
    };

    return directive;

    function appendEllipsis( element, attrs ) {
      var $ = angular.element;
      if ( $( element )[ 0 ].scrollHeight > 97 && !$( element.find( '.ellipsis' ) ).length ) {

        var isOpenedByClick = false;
        $( element ).css( 'height', '96px' );
        $( element ).append( '<button class="ellipsis pull-right">...</button>' );

        $( element.find( '.ellipsis' ) ).popover( {
          html: true,
          content: attrs.popoverHtml,
          placement: 'top',
          container: 'body',
          trigger: 'manual'
        } );

        $( element.find( '.ellipsis' ) ).bind( 'click', function () {
          if ( !$( '.popover' ).length ) {
            $( this ).focus();
          } else {
            $( this ).blur();
          }
        } );

        $( element.find( '.ellipsis' ) ).bind( 'mouseover', function () {
          if ( !$( '.popover' ).length ) {
            $( this ).focus();
          }
        } );

        $( element.find( '.ellipsis' ) ).bind( 'mouseout', function () {
          if ( !isOpenedByClick )
            $( this ).blur();
        } );


        $( element.find( '.ellipsis' ) ).bind( 'blur', function () {
          $( this ).popover( 'hide' );
          isOpenedByClick = false;
        } );

        $( element.find( '.ellipsis' ) ).bind( 'focus', function () {
          $( this ).popover( 'show' );
        } );

        $( element.find( 'p' ) ).bind( 'click', function () {
          var eliipsis = $( element.find( '.ellipsis' ) );
          if ( !$( '.popover' ).length ) {
            eliipsis.focus();
            isOpenedByClick = true;
          } else {
            eliipsis.blur();
          }
        } );

      }
      if ( $( element )[ 0 ].clientHeight === $( element )[ 0 ].scrollHeight && $( element.find( '.ellipsis' ) ).length ) {
        $( element.find( '.ellipsis' ) ).remove();
        $( element.find( 'p' ) ).unbind( 'click' );
      }
    }

    function link( scope, element, attrs ) {

      scope.$watch( '$viewContentLoaded',
        function () {
          appendEllipsis( element, attrs );
        } );

      scope.$watch( function () {
        return $window.innerWidth;
      }, function () {
        appendEllipsis( element, attrs );
      } );

    }
  } ] );
} )( angular );
