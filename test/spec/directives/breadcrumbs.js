'use strict';

describe('Directive: breadCrumbs', function () {

  // load the directive's module
  beforeEach(module('geoelectoralFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<bread-crumbs></bread-crumbs>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the breadCrumbs directive');
  }));
});
