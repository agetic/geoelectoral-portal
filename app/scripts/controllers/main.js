'use strict';

/**
 * @ngdoc function
 * @name geoelectoralFrontendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the geoelectoralFrontendApp
 */
angular.module('geoelectoralFrontendApp')
  .controller('MainCtrl', function ($scope, $http) {

    // Elecciones generales a nivel Bolivia
    var eleccionesUrl = '//localhost:3000/api/v1/elecciones?anio={anio}&formato=json';

    $scope.anio = 2009;

    // Funciones
    var loadElecciones = function() {
      var url = eleccionesUrl.replace(/{anio}/g, $scope.anio);
      $http.get(url).then(function(response) {
        $scope.partidos = response.data.dpas[0].partidos;
        $scope.eleccion = response.data.eleccion;
        // Color plomo para los partidos sin color
        $scope.partidos = $scope.partidos.map(function(p) {
          if (!p.color) {
            p.color = '808080';
          }
          return p;
        });
      }, function(err) {
        throw err;
      });
    };

    loadElecciones();

    // Acciones controlador
    $scope.setAnio = function(anio) {
      $scope.anio = anio;
      loadElecciones();
    };

  });
