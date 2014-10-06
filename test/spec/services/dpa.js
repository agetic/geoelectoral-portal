'use strict';

describe('Service: Dpa', function () {

  // load the service's module
  beforeEach(module('geoelectoralFrontendApp'));

  // instantiate service
  var Dpa;
  beforeEach(inject(function (_Dpa_) {
    Dpa = _Dpa_;
  }));

  it('should do something', function () {
    expect(!!Dpa).toBe(true);
  });

});
