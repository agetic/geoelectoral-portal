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
    'ngRoute', 'config', 'angular-growl','angular-loading-bar', 'ngAnimate','ngCsv'])
  .config(function($routeProvider, growlProvider) {
      // Growl configuraciones
      growlProvider.globalTimeToLive(3000);
      growlProvider.globalDisableCountDown(true);
      growlProvider.globalDisableIcons(true);

      // Rutas
      $routeProvider.
        when('/elecciones/:anio', {
          templateUrl: 'views/main.html'
        }).
        when('/elecciones/:anio/dpa/:idDpa', {
          templateUrl: 'views/main.html'
        }).
        otherwise({
          redirectTo: '/elecciones/2014'
        });
  });