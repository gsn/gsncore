describe('Controller: ctrlAccount', function() {
  'use strict';

  var $rootScope,
    $scope,
    $controller;

  // initializing the module
  beforeEach(module('gsn.core'));

  // injecting values
  beforeEach(inject(function(_$rootScope_, _$controller_, gsnProfile, gsnApi, _$timeout_, gsnStore) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;

    $controller('ctrlAccount', {
      '$rootScope': $rootScope,
      '$scope': $scope,
      'gsnProfile': gsnProfile,
      'gsnApi': gsnApi,
      '$timeout': _$timeout_,
      'gsnStore': gsnStore
    });
  }));

  // begin tests
  it('scope should be initialized with hasSubmitted of false', function() {
    expect($scope.hasSubmitted).toEqual(false);
  });
});
