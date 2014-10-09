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
    'ngRoute', 'config'
  ])
  .config(function($routeProvider) {
      $routeProvider.
        when('/elecciones/:anio', {
          templateUrl: 'views/main.html'
        }).
        when('/elecciones/:anio/dpa/:idDpa', {
          templateUrl: 'views/main.html'
        }).
        otherwise({
          redirectTo: '/elecciones/2009'
        });
  });