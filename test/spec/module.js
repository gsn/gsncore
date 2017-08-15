describe('Service: gsnApi', function() {
  'use strict';

  var $service,
    rootScope;

  // initializing the module
  beforeEach(module('gsn.core'));

  // injecting values
  beforeEach(inject(function($injector, $rootScope) {
    rootScope = $rootScope;
    $service = $injector.get('gsnApi');
  }));

  // begin tests
  describe('When calling utility method isNull', function() {
    it('should return default value if it is null', function() {
      expect($service.isNull(null, 'test')).toBe('test');
    });

    it('should return value if not null', function() {
      expect($service.isNull('actual', 'test')).toBe('actual');
    });
  });
});
