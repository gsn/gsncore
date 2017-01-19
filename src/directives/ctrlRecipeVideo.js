(function (angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlRecipeVideo';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$location', '$timeout', '$rootScope', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnStore, gsnApi, $location, $timeout, $rootScope) {
    $scope.activate = activate;
    $scope.vm = {
      video: {},
      videos: [],
      videoById: {}
    };
    var pathId = angular.lowercase($location.path()).replace(/\D*/, '')
    $scope.id = ($location.search().id || pathId || 'featured');

    function activate() {
      if ($scope.id == 'featured' || $scope.id === '') {
        if ($scope.currentPath.indexOf('featured') < 0) {
          $scope.goUrl($scope.featuredVideoUrl || '/recipevideo/featured');
          return;
        }
      }

      gsnStore.getRecipeVideos().then(function(result) {
        if (result.success) {
          $scope.vm.videos = result.response;
          $scope.vm.videoById = gsnApi.mapObject(result.response, 'VideoId');
          if ($scope.id !== 'featured'){
            $scope.vm.video = $scope.vm.videoById[$scope.id]
          }
        }
      });

      if ($scope.id == 'featured') {
        gsnStore.getFeaturedVideo().then(function(result){
          if (result.success) {
            result.response.ImageUrl = (result.response.ImageUrl || {}).replace('http://', '//');
            $scope.vm.video = result.response;
          }
        });
      }
    }

    function playVideo() {
      $timeout(function () {
        flowplayer('RecipeVideoPlayer', 'https://cdn.gsngrocers.com/script/lib/flowplayer-3.2.18.swf', {
          clip: {
            url: $scope.vm.video.Url,
            autoPlay: true,
            autoBuffering: true // <- do not place a comma here
          }
        });

        $rootScope.$broadcast('gsnevent:loadads');
      }, 500);
    }

    $scope.$watch('vm.video', playVideo);

    activate();
  }
})(angular);
