'use strict';

describe('Directive: barrasBolivia', function () {

  // load the directive's module
  beforeEach(module('geoelectoralFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<barras-bolivia></barras-bolivia>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the barrasBolivia directive');
  }));
});
