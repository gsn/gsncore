describe('Filter: defaultIf', function() {
  'use strict';

  var $filter;

  // initializing the module
  beforeEach(module('gsn.core'));

  // injecting values
  beforeEach(inject(function(_$filter_) {
    $filter = _$filter_;
  }));

  // begin tests
  it('it should default to a value for true value condition', function() {
    // Arrange.
    var string = 'some default',
      result;

    // Act.
    result = $filter('defaultIf')('original', true, string);

    // Assert.
    expect(result).toEqual(string);
  });

  it('it should not default for false value condition', function() {
    // Arrange.
    var string = 'some default',
      result;

    // Act.
    result = $filter('defaultIf')('original', false, string);

    // Assert.
    expect(result).toEqual('original');
  });

  it('it should default to a value for true closure condition', function() {
    // Arrange.
    var string = 'some default',
      result;

    // Act.
    result = $filter('defaultIf')('original', function() {
      return true;
    }, string);

    // Assert.
    expect(result).toEqual(string);
  });

  it('it should not default for false closure condition', function() {
    // Arrange.
    var string = 'some default',
      result;

    // Act.
    result = $filter('defaultIf')('original', function() {
      return false;
    }, string);

    // Assert.
    expect(result).toEqual('original');
  });

});
