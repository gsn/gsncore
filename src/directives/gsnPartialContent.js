(function(angular, undefined) {
    'use strict';
    var myModule = angular.module('gsn.core');
    myModule.directive('gsnPartialContent', ['$timeout', 'gsnStore', 'gsnApi', '$location', '$anchorScroll', function($timeout, gsnStore, gsnApi, $location, $anchorScroll) {
        // Usage:   allow for store specific partial content
        //
        // Creates: 2015-02-26
        //
        var directive = {
            link: link,
            restrict: 'EA',
            scope: true,
        };
        return directive;

        function link(scope, element, attrs) {
            var currentPath = angular.lowercase(gsnApi.isNull($location.path().replace(/^\/+/gi, ''), '').replace(/[\-]/gi, ' '));
            attrs.gsnPartialContent = attrs.gsnPartialContent || currentPath;
            scope.activate = activate;
            scope.pcvm = {
                hasScript: false,
                notFound: false,
                isLoading: true,
                layout: 'default',
                tab: $location.search().tab || 0
            }
            scope.partialContents = [];
            scope.contentDetail = {
                url: gsnApi.isNull(attrs.gsnPartialContent.replace(/^\/+/gi, ''), '').replace(/[\-]/gi, ' '),
                name: '',
                subName: ''
            };
            var partialData = {
                ContentData: {},
                ConfigData: {},
                ContentList: []
            };

            function activate() {
                // parse contentName by forward slash
                var contentNames = scope.contentDetail.url.split('/');
                if (contentNames.length > 1) {
                    scope.contentDetail.subName = contentNames[1];
                }
                scope.contentDetail.name = contentNames[0];
                if (scope.contentDetail.url.indexOf('.aspx') > 0) {
                    return;
                }
                // attempt to retrieve static content remotely
                gsnStore.getPartial(scope.contentDetail.name).then(function(rst) {
                    scope.pcvm.hasScript = false
                    scope.pcvm.isLoading = false
                    if (rst.success) {
                        scope.pcvm.notFound = rst.response == "null";
                        processData(rst.response);
                    }
                });
            }
            scope.getContentList = function() {
                var result = [];
                if (partialData.ContentList) {
                    for (var i = 0; i < partialData.ContentList.length; i++) {
                        var data = gsnApi.parseStoreSpecificContent(partialData.ContentList[i]);
                        if (data.Headline || data.SortBy) {
                            // match any script with src
                            if (/<script.+src=/gi.test(data.Description || '')) {
                                scope.pcvm.hasScript = true
                            }
                            if (gsnApi.isNull(scope.contentDetail.subName, 0).length <= 0) {
                                result.push(data);
                                continue;
                            }
                            if (angular.lowercase(data.Headline || '') == scope.contentDetail.subName || data.SortBy == scope.contentDetail.subName) {
                                result.push(data);
                            }
                        }
                    }
                }
                return result;
            };
            scope.getContent = function(index) {
                return gsnApi.parseStoreSpecificContent(partialData.ContentData[index]);
            };
            scope.getConfig = function(name) {
                return gsnApi.parseStoreSpecificContent(partialData.ConfigData[name]) || {};
            };
            scope.getConfigDescription = function(name, defaultValue) {
                var resultObj = scope.getConfig(name).Description;
                return gsnApi.isNull(resultObj, defaultValue);
            };
            scope.activate();
            //#region Internal Methods
            function processData(data) {
                partialData = gsnApi.parsePartialContentData(data);
                scope.partialContents = scope.getContentList();
                scope.pcvm.layout = scope.getConfig('layout').Description || 'default';
                if ($location.hash()) {
                    $timeout(function() {
                        $anchorScroll();
                    }, 1000);
                }
            }
            //#endregion
        }
    }]);
})(angular);