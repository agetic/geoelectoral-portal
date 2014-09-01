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

    $scope.anios = [1979, 1980, 1985, 1989, 1993, 1997, 2002, 2005, 2006, 2009];
    $scope.e = { anioIndex: 9 };
    $scope.anio = $scope.anios[$scope.e.anioIndex];
    $scope.eleccion = {};
    $scope.partidos = [];
    $scope.partidosDepartamento = [];
    $scope.dpaGeoJSON = [];
    $scope.gris = 'bbb';
    $scope.porcetajeGroup = 3; // 3% Porcentaje de agrupación

    $scope.$watch('e.anioIndex', function(newValue, oldValue) {
      $scope.anio = $scope.anios[$scope.e.anioIndex];
    });

    // Funciones
    var eliminarValidos = function(partidos) {
      return partidos.slice(0, partidos.length-1);
    };
    var establecerColorValidos = function(dpas) {
      return dpas.map(function(d) {
        d.partidos = eliminarValidos(d.partidos);
        return d;
      });
    };
    // Elecciones a nivel país
    var loadElecciones = function() {
      var url = eleccionesUrl.replace(/{anio}/g, $scope.anio);
      $http.get(url).then(function(response) {
        $scope.partidos = eliminarValidos(response.data.dpas[0].partidos);
        $scope.partidos = $scope.partidos.sort(function(a, b) { return a.porcentaje - b.porcentaje; });
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
