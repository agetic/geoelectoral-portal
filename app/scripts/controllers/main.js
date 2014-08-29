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
    var host = '//localhost:3000';
    var api = '/api/v1';
    var eleccionesUrl = host + api + '/elecciones?anio={anio}&formato=json';
    var eleccionesDeptoUrl = host + api + '/elecciones?anio={anio}&id_tipo_dpa=2&formato=json';
    var dpaGeoJSONUrl = host + api + '/proxy';

    $scope.anio = 2009;
    $scope.eleccion = {};
    $scope.partidos = [];
    $scope.partidosDepartamento = [];
    $scope.dpaGeoJSON = [];

    // Funciones
    var eliminarValidos = function(partidos) {
      return partidos.slice(0, partidos.length-1);
    };
    var establecerColorValidos = function(dpas) {
      return dpas.map(function(d) {
        d.partidos = establecerColor(eliminarValidos(d.partidos));
        return d;
      });
    };
    var establecerColor = function(partidos) {
      return partidos.map(function(p) {
        if (!p.color) {
          p.color = '808080';
        }
        return p;
      });
    };
    // Elecciones a nivel país
    var loadElecciones = function() {
      var url = eleccionesUrl.replace(/{anio}/g, $scope.anio);
      $http.get(url).then(function(response) {
        $scope.partidos = establecerColor(eliminarValidos(response.data.dpas[0].partidos));
        $scope.eleccion = response.data.eleccion;
      }, function(err) {
        throw err;
      });
    };
    // Elecciones a nivel departamento
    var loadEleccionesDepartamento = function() {
      var url = eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio);
      $http.get(url).then(function(response) {
        $scope.partidosDepartamento = establecerColorValidos(response.data.dpas);
        $scope.eleccion = response.data.eleccion;
      }, function(err) {
        throw err;
      });
    };
    // GeoJSON político administrativo de Bolivia
    var loadGeoJSON = function() {
      var url = dpaGeoJSONUrl.replace(/{anio}/g, $scope.anio);
      $http.get(url).then(function(response) {
        $scope.dpaGeoJSON = response;
      }, function(err) {
        throw err;
      });
    };

    loadGeoJSON();
    loadElecciones();
    loadEleccionesDepartamento();

    // Acciones controlador
    $scope.setAnio = function(anio) {
      $scope.anio = anio;
      loadElecciones();
    };

  });
