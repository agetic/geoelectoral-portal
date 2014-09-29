'use strict';

/**
 * @ngdoc function
 * @name geoelectoralFrontendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the geoelectoralFrontendApp
 */
angular.module('geoelectoralFrontendApp')
  .controller('MainCtrl', function ($scope, $http, $q, $routeParams, $location, ENV) {
    // Elecciones generales a nivel Bolivia
    var host = ENV.geoelectoralApi;
    var api = ENV.geoelectoralApiVersion;
    var aniosUrl = host + api + '/anios';
    var eleccionesUrl = host + api + '/elecciones?anio={anio}&formato=json';
    var eleccionesDeptoUrl = host + api + '/elecciones?anio={anio}&id_tipo_dpa={idTipoDpa}&formato=json';
    var dpaGeoJSONUrl = host + api + '/proxy';

    $scope.anios = [1979, 1980, 1985, 1989, 1993, 1997, 2002, 2005, 2009];
    $scope.tiposDpa = [
      { idTipoDpa: 1, nombre: 'país', idTipoDpaSuperior: null },
      { idTipoDpa: 2, nombre: 'departamento', idTipoDpaSuperior: 1 },
      { idTipoDpa: 3, nombre: 'provincia', idTipoDpaSuperior: 2 },
      { idTipoDpa: 4, nombre: 'municipio', idTipoDpaSuperior: 3 },
      { idTipoDpa: 5, nombre: 'circunscripción', idTipoDpaSuperior: 2 }
    ];
    $scope.e = { anioIndex: $scope.anios.length - 1 };
    $scope.anio = $scope.anios[$scope.e.anioIndex];
    $scope.eleccion = {};
    $scope.partidos = [];
    $scope.partidosDepartamento = [];
    $scope.dpaGeoJSON = [];
    $scope.gris = 'bbb';
    $scope.porcetajeGroup = 3; // 3% Porcentaje de agrupación
    $scope.currentDpa = {
                          idDpa: 1,            // Dpa que se está mostrando actualmente
                          idTipoDpa: 2,        // Tipo de Dpa hijos que se va mostrar
                          dpaNombre: 'Bolivia' // Nombre del dpa actual
                        };

    // Se ejecuta cuando cambia el año en el slider
    $scope.$watch('e.anioIndex', function() {
      $scope.anio = $scope.anios[$scope.e.anioIndex];
      if ($scope.currentDpa.idDpa > 1) {
        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
      } else {
        $location.path('/elecciones/' + $scope.anio);
      }
    });

    // Se ejecuta cuando se hace clic a un departamento, provincia, ...
    $scope.$watch('currentDpa.idDpa', function() {
      if ($scope.currentDpa.idDpa > 1) {
        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
      }
    });

    // Se ejecuta cuando hay cambios en la URL
    $scope.$on('$routeChangeSuccess', function() {
      if ($routeParams.anio && $routeParams.idDpa) {
        $scope.e = { anioIndex: $scope.anios.indexOf(parseInt($routeParams.anio)) };
        $scope.anio = $scope.anios[$scope.e.anioIndex];
        loadServices();
      } else if ($routeParams.anio) {
        $scope.e = { anioIndex: $scope.anios.indexOf(parseInt($routeParams.anio)) };
        $scope.anio = $scope.anios[$scope.e.anioIndex];
        loadServices();
      } else {
        return;
      }
    });

    // Hover sobre las filas de la tabla
    $scope.hoverIn = function() {
      this.hoverTooltip = true;
    };
    $scope.hoverOut = function() {
      this.hoverTooltip = false;
    };

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
    var loadServices = function() {
      var promises = [];
      // GeoJSON político administrativo de Bolivia
      promises.push($http.get(dpaGeoJSONUrl, { params: $scope.currentDpa }));
      // Años de las elecciones generales
      promises.push($http.get(aniosUrl));
      // Elecciones a nivel país
      promises.push($http.get(eleccionesUrl.replace(/{anio}/g, $scope.anio)));
      // Elecciones a nivel departamento
      promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                                                .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));

      $q.all(promises).then(function(response) {
        $scope.dpaGeoJSON = response[0];
        //$scope.anios = response[1].data.anios;
        $scope.partidos = eliminarValidos(response[2].data.dpas[0].partidos);
        $scope.partidos = $scope.partidos.sort(function(a, b) { return a.porcentaje - b.porcentaje; });
        $scope.eleccion = response[2].data.eleccion;
        $scope.partidosDepartamento = establecerColorValidos(response[3].data.dpas);
      }, function(error) {
        console.warn("Error en la conexión a GeoElectoral API");
      });
    };
  });
