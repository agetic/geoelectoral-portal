'use strict';

describe('Directive: mapaBolivia', function () {

  // load the directive's module
  beforeEach(module('geoelectoralFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<mapa-bolivia></mapa-bolivia>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the mapaBolivia directive');
  }));
});
