(function(angular, undefined) {
  'use strict';
  var myModule = angular.module('gsn.core');

  myModule.directive('gsnProposeApp', ['gsnApi', '$localStorage', '$compile', function(gsnApi, $localStorage, $compile) {
    // Usage: Propose customer download mobile app
    //
    // Creates: 2016-1-12 PavelD
    //
    var directive = {
      restrict: 'A',
      scope: true,
      link: link
    };
    return directive;

    function link(scope, element, attrs) {

      scope.isIOS = gsnApi.browser.isIOS;
      scope.isAndroid = gsnApi.browser.isAndroid;

      // going to show this popUp only for iOs and Android users
      if (!gsnApi.browser.isMobile && !(scope.isIOS || scope.isAndroid))
        return;

      if ($localStorage.hasMobileApp)
        return;

      var url = '//clientapi.gsn2.com/api/v1/content/meta/' + gsnApi.getChainId() + '/?name=home%20page&meta=mobileAppPage&type=text/html&nocache=';
      var today = new Date();
      var nocache = today.getFullYear() + '' + today.getMonth() + '' + today.getDate() + '' + today.getHours();

      gsnApi.http({}, url + nocache)
        .then(function(response) {
          if (response.success) {

            var myHtml = '<div class="myModalForm" style="display: block"><div class="modal-dialog">' + response.response + '</div></div>"';
            var $modalElement = angular.element($compile(myHtml)(scope));

            // console.log( 'redirect to page or show PopUp' );
            gmodal.show({
              content: $modalElement[0]
            });
          }
        });

      scope.downloadApp = function(url) {
        $localStorage.hasMobileApp = true;
        gsnApi.goUrl(url, '_self');
      };

      scope.rejectApp = function() {
        $localStorage.hasMobileApp = true;
        return gmodal.hide();
      };
    }
  }]);

})(angular);
