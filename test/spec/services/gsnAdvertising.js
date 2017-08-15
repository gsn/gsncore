describe('Service: gsnAdvertising', function() {
  'use strict';

  var $service,
    $window,
    $timeout,
    injector;

  // initializing the module
  beforeEach(module('gsn.core'));

  // injecting values
  beforeEach(inject(function($injector, _$timeout_, _$window_) {
    $timeout = _$timeout_;
    $window = _$window_;
    $service = $injector.get('gsnAdvertising');
  }));

  // begin tests
  it('it should handle clickRecipe, Product, Link, and BrickOffer event', function() {
    expect($window.Gsn.Advertising.listeners['clickRecipe']).toBeDefined();
    expect($window.Gsn.Advertising.listeners['clickProduct']).toBeDefined();
    expect($window.Gsn.Advertising.listeners['clickLink']).toBeDefined();
    expect($window.Gsn.Advertising.listeners['clickBrickOffer']).toBeDefined();
  });

});
