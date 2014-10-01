'use strict';

describe('Service: GrupoFactory', function () {

  // load the service's module
  beforeEach(module('geoelectoralFrontendApp'));

  // instantiate service
  var GrupoFactory;
  beforeEach(inject(function (_GrupoFactory_) {
    GrupoFactory = _GrupoFactory_;
  }));

  it('should do something', function () {
    expect(!!GrupoFactory).toBe(true);
  });

});
