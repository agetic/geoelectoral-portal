'use strict';

/**
 * @ngdoc function
 * @name geoelectoralFrontendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the geoelectoralFrontendApp
 */
angular.module('geoelectoralFrontendApp')
  .controller('MainCtrl', function ($scope, $http, $q, $routeParams, $location, ENV, Dpa, BreadcrumbFactory, growl) {
    // Elecciones generales a nivel Bolivia
    var host = ENV.geoelectoralApi;
    var api = ENV.geoelectoralApiVersion;
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
    $scope.partidoSeleccionado = null;
    $scope.e = { anioIndex: $scope.anios.length - 1 };
    $scope.anio = $scope.anios[$scope.e.anioIndex];
    $scope.partidos = [];
    $scope.partidosDepartamento = [];
    $scope.dpaGeoJSON = [];
    $scope.gris = ENV.color;
    $scope.porcetajeGroup = 3; // 3% Porcentaje de agrupación
    $scope.currentDpa = {
                          idDpa: 1,             // Dpa que se está mostrando actualmente
                          idTipoDpaActual: 1,   // Tipo de Dpa del dpa actual
                          dpaNombre: 'Bolivia', // Nombre del dpa actual
                          idTipoDpa: 2          // Tipo de Dpa hijos que se va mostrar
                        };

    var breadcrumbFactory = function() {
      BreadcrumbFactory.fromDpa('mapa-breadcrumb', Dpa.breadcrumb($scope.currentDpa.idDpa), $scope.anio);
    };

    // Se ejecuta cuando cambia el año en el slider
    $scope.$watch('e.anioIndex', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.partidoSeleccionado = null;
        $scope.anio = $scope.anios[$scope.e.anioIndex];
        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
      }
    });

    // Se ejecuta cuando se hace clic a un departamento, provincia, ...
    $scope.$watch('currentDpa.idDpa', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
      }
    });

    // Se ejecuta cuando hay cambios en la URL
    $scope.$on('$routeChangeSuccess', function() {
      if ($routeParams.anio && $routeParams.idDpa) {
        Dpa.query().then(function(data) {
          $scope.currentDpa = Dpa.find(parseInt($routeParams.idDpa));;
          $scope.e = { anioIndex: $scope.anios.indexOf(parseInt($routeParams.anio)) };
          $scope.anio = $scope.anios[$scope.e.anioIndex];
          if ($scope.e.anioIndex >= 0) {
            loadServices();
            breadcrumbFactory();
          } else {
            $scope.e = { anioIndex: $scope.anios.length - 1 };
            $scope.anio = $scope.anios[$scope.e.anioIndex];
            $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
          }
        });
      } else if ($routeParams.anio) {
        $scope.e = { anioIndex: $scope.anios.indexOf(parseInt($routeParams.anio)) };
        $scope.anio = $scope.anios[$scope.e.anioIndex];
        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
      } else {
        return;
      }
    });

    // Hover sobre las filas de la tabla
    $scope.hoverIn = function() {
      jQuery('.tooltip-tabla').tooltip();
    };

    // Establecer el título para la ubicación en el mapa
    $scope.getLugar = function() {
      var titulo = $scope.currentDpa.dpaNombre;
      if ($scope.currentDpa.idDpa > 1) {
        $scope.tiposDpa.some(function(e) {
          if (e.idTipoDpa === $scope.currentDpa.idTipoDpaActual) {
            titulo = capitalize(e.nombre) + ' ' + titulo;
            return true;
          }
        });
      }
      return titulo;
    };

    // Establecer el tipo de dpa para mostrar en el mapa
    $scope.setTipoDpa = function (idTipoDpa) {
      if (idTipoDpa >= $scope.currentDpa.idTipoDpaActual) {
        $scope.currentDpa.idTipoDpa = idTipoDpa;
        recargarMapa();
      } else {
        growl.info("No se puede mostrar el mapa", {});
      }
    };
    $scope.getTipoDpa = function () {
      return $scope.currentDpa.idTipoDpa;
    };

    // Establecer clases para la bandera
    $scope.establecerClases = function(partido) {
      var clases = [];
      if (partido.color == undefined) {
        clases.push('sinbandera');
      }
      if ($scope.partidoSeleccionado && partido.id_partido === $scope.partidoSeleccionado.id_partido) {
        clases.push('seleccionado');
      }
      return clases.join(' ');
    };

    // Seleccionar un partido en la tabla de votos
    $scope.seleccionarPartido = function(index) {
      if ($scope.partidoSeleccionado && $scope.partidoSeleccionado === $scope.partidos[index]) {
        $scope.partidoSeleccionado = null;
      } else {
        $scope.partidoSeleccionado = $scope.partidos[index];
      }
    };

    // Funciones
    var agruparPartidos = function (dpas, idDpa) {
      var partidos = [], r = null;
      dpas.forEach(function (d) {
        if (idDpa === d.id_dpa_superior) {
          angular.copy(d.partidos).forEach(function (p) {
            r = null;
            partidos.some(function (q) {
              if (q.id_partido === p.id_partido) {
                r = q;
                return true;
              }
            });
            if (r) {
              r.resultado = r.resultado + p.resultado;
            } else {
              partidos.push(p);
            }
          });
        }
      });
      if (partidos.length === 0) {
        dpas.forEach(function (d) {
          if (idDpa === d.id_dpa) {
            partidos = angular.copy(d.partidos);
          }
        });
      }
      return calcularPorcentaje(partidos);
    };
    var calcularPorcentaje = function (partidos) {
      var total = 0;
      partidos.forEach(function (p) {
        total += p.resultado;
      });
      partidos.forEach(function (p) {
        p.porcentaje = Math.ceil((p.resultado / total) * 100 * 100) / 100;
      });
      return partidos;
    };
    var capitalize = function(string) {
      return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
    };
    var eliminarValidos = function(partidos) {
      return partidos.slice(0, partidos.length-1);
    };
    var establecerColorValidos = function(dpas) {
      return dpas.map(function(d) {
        d.partidos = eliminarValidos(d.partidos);
        return d;
      });
    };
    var redireccionLugarSuperior = function () {
      var breadcrumbs = BreadcrumbFactory.get('mapa-breadcrumb');
      growl.info("No hay datos de elecciones disponibles", {});
      if (breadcrumbs.length > 1) {
        $location.path(breadcrumbs[breadcrumbs.length - 2].href.replace(/^#/g, ''));
      }
    };
    var reducirDpasVista = function (votos) {
      var votosDpa = [];
      angular.copy(votos).forEach(function (v, i) {
        if (Dpa.verificarSuperior($scope.currentDpa.idDpa, v.id_dpa)) {
          votosDpa.push(v);
        }
      });
      if (votosDpa.length === 0) {
        angular.copy(votos).forEach(function (v, i) {
          if (v.id_dpa === $scope.currentDpa.idDpa) {
            votosDpa.push(v);
          }
        });
      };
      return votosDpa;
    };
    var reducePorAnio = function (dpas) {
      var p, fechaCreacion, fechaSupresion, features, anioCreacion, anioSupresion, eliminados = 1;
      features = dpas.data.features;
      // TODO mejorar el algoritmo de eliminación de dpas que no corresponde a ese año
      while (eliminados !== 0) {
        eliminados = 0;
        features.forEach(function (d, i) {
          p = d.properties;
          fechaCreacion = Date.parse(p.fecha_creacion_corte);
          fechaSupresion = Date.parse(p.fecha_supresion_corte);
          if (!isNaN(fechaCreacion) && !isNaN(fechaSupresion)) {
            anioCreacion = new Date(fechaCreacion).getFullYear();
            anioSupresion = new Date(fechaSupresion).getFullYear();
            if (!(anioCreacion <= $scope.anio && $scope.anio <= anioSupresion)) {
              features.splice(i, 1);
              eliminados += 1;
            }
          } else if (!isNaN(fechaCreacion)) {
            anioCreacion = new Date(fechaCreacion).getFullYear();
            if (!(anioCreacion <= $scope.anio)) {
              features.splice(i, 1);
              eliminados += 1;
            }
          }
        });
      }
      return dpas;
    };
    var loadServices = function() {
      var promises = [];
      // GeoJSON político administrativo de Bolivia
      promises.push($http.get(dpaGeoJSONUrl, { params: $scope.currentDpa }));
      // Elecciones a nivel departamento
      promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                                                .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));

      $q.all(promises).then(function(response) {
        if (response[1].data.dpas) {
          $scope.dpaGeoJSON = reducePorAnio(response[0]);
          $scope.partidosDepartamento = establecerColorValidos(response[1].data.dpas);
          $scope.partidosDepartamento = reducirDpasVista($scope.partidosDepartamento);          
          $scope.partidos = agruparPartidos($scope.partidosDepartamento, $scope.currentDpa.idDpa);
          $scope.partidos = $scope.partidos.sort(function(a, b) { return b.porcentaje - a.porcentaje; });
        } else {
          redireccionLugarSuperior();
        }
      }, function(error) {
        console.warn("Error en la conexión a GeoElectoral API");
      });
    };
    var recargarMapa = function() {
      var promises = [];
      // GeoJSON político administrativo de Bolivia
      promises.push($http.get(dpaGeoJSONUrl, { params: $scope.currentDpa }));
      // Elecciones a nivel departamento
      promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                                                .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));

      $q.all(promises).then(function(response) {
        if (response[1].data.dpas) {
          $scope.dpaGeoJSON = reducePorAnio(response[0]);
          $scope.partidosDepartamento = establecerColorValidos(response[1].data.dpas);
          $scope.partidosDepartamento = reducirDpasVista($scope.partidosDepartamento);                    
        } else {
          redireccionLugarSuperior();
        }
      }, function(error) {
        console.warn("Error en la conexión a GeoElectoral API");
      });
    };
  });
