( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlLogin';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnApi', '$location', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController( $scope, gsnApi, $location ) {
    $scope.activate = activate;
    $scope.fromUrl = '/';

    function activate() {

      $scope.fromUrl = decodeURIComponent( gsnApi.isNull( $location.search().fromUrl, '' ) );
      if ( !$scope.isLoggedIn ) {
        $scope.gvm.loginCounter++;
      } else {
        $scope.goUrl( $scope.fromUrl.length > 0 ? $scope.fromUrl : '/' );
      }
    }

    $scope.activate();
  }

} )( angular );
