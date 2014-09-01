'use strict';

/**
 * @ngdoc overview
 * @name geoelectoralFrontendApp
 * @description
 * # geoelectoralFrontendApp
 *
 * Main module of the application.
 */
angular
  .module('geoelectoralFrontendApp', [
    'ngRoute'
  ])
  .config(function($routeProvider) {
      $routeProvider.
        when('/elecciones/:anio', {
          templateUrl: 'views/main.html'
        }).
        otherwise({
          redirectTo: '/elecciones/2009'
        });
  });