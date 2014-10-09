'use strict';

describe('Service: BreadcrumbFactory', function () {

  // load the service's module
  beforeEach(module('geoelectoralFrontendApp'));

  // instantiate service
  var BreadcrumbFactory;
  beforeEach(inject(function (_BreadcrumbFactory_) {
    BreadcrumbFactory = _BreadcrumbFactory_;
  }));

  it('should do something', function () {
    expect(!!BreadcrumbFactory).toBe(true);
  });

});
