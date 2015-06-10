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
    var eleccionesUrl = host + api + '/elecciones?anio={anio}&id_tipo_dpa={idTipoDpa}&id_dpa={idDpa}&id_tipo_eleccion={idTipoEleccion}&formato=json';
    var eleccionesDeptoUrl = host + api + '/elecciones?anio={anio}&id_tipo_dpa={idTipoDpa}&id_tipo_eleccion={idTipoEleccion}&formato=json';
    var dpaGeoJSONUrl = host + api + '/proxy';

    $scope.mapControl = {ajustar: true};
    $scope.date = new Date();

    $scope.anios = [1979, 1980, 1985, 1989, 1993, 1997, 2002, 2005, 2009, 2014].reverse();
    $scope.aniosLista = null;
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
    $scope.eleccion = null;
    $scope.dpaGeoJSON = [];
    $scope.gris = ENV.color;
    $scope.porcetajeGroup = 3; // 3% Porcentaje de agrupación
    $scope.currentDpa = {
                          idDpa: 1,             // Dpa que se está mostrando actualmente
                          idTipoDpaActual: 1,   // Tipo de Dpa del dpa actual
                          idTipoEleccion: 1,    // Tipo de la Elección: plurinominal, uninominal
                          dpaNombre: 'Bolivia', // Nombre del dpa actual
                          idTipoDpa: null       // Tipo de Dpa hijos que se va mostrar
                        };

    var breadcrumbFactory = function() {
      BreadcrumbFactory.fromDpa('mapa-breadcrumb', Dpa.breadcrumb($scope.currentDpa.idDpa), $scope.anio);
    };

    // Se ejecuta cuando se hace clic a un departamento, provincia, ...
    $scope.$watch('currentDpa.idDpa', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
      }
    });

    // Obtener anios y sus respectivas elecciones
    function getAnios(callback){
      if(!$scope.aniosLista){
        $http.get(host+api+"/anios").then(function(response){
          $scope.aniosLista = response.data.anios.reverse();
          if($scope.aniosLista[0].anio){
            for(var a in $scope.aniosLista)
              $scope.anios[a]=$scope.aniosLista[a].anio;
            $scope.e = { anioIndex: 0 };
            $scope.anio = $scope.anios[0];
            $scope.eleccion = $scope.aniosLista[0];
            $scope.eleccion.fecha = $scope.eleccion.descripcion;
          }
          callback();
        });
      }else{
        callback();
      }
    }
    // Se ejecuta cuando hay cambios en la URL
    $scope.$on('$routeChangeSuccess', function() {
      if ($routeParams.anio && $routeParams.idDpa) {
        if(isNaN(parseInt($routeParams.idDpa))){
          $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
          return;
        }
        getAnios(function(){
          $scope.currentDpa.idDpa = parseInt($routeParams.idDpa);
          if( !$scope.aniosLista.some(function(a,i){
                if(a.anio==parseInt($routeParams.anio)){
                  $scope.anio = parseInt($routeParams.anio);
                  $scope.e.anioIndex=i;
                  $scope.eleccion = a;
                  $scope.eleccion.fecha = $scope.eleccion.descripcion;
                  return true;
                }
              })
            ){
              $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
              return;
             }
          // ver si existe el tipo eleccion y tipo dpa.
          var iEleccion=0,iTipoDpa=0;
          $scope.eleccion.tipos_eleccion.some(function(el,i){
            if(el.id_tipo_eleccion==$scope.currentDpa.idTipoEleccion){
              iEleccion=i;
              return true;
            }
          });
          $scope.currentDpa.idTipoEleccion = $scope.eleccion.tipos_eleccion[iEleccion].id_tipo_eleccion;
          $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa.some(function(idt,i){
            if(idt==$scope.currentDpa.idTipoDpa){
              iTipoDpa=i;
              return true;
            }
          });
          $scope.currentDpa.idTipoDpa = $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa[iTipoDpa];
          if($scope.currentDpa.idTipoDpaActual==$scope.currentDpa.idTipoDpa &&
             $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa[iTipoDpa+1])
            $scope.currentDpa.idTipoDpa = $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa[iTipoDpa+1];
          Dpa.query($scope.eleccion.fecha).then(function(data) {
            loadServices();
            breadcrumbFactory();
          });
        });
      } else if ($routeParams.anio) {
        getAnios(function(){
              $scope.aniosLista.some(function(a,i){
                if(a.anio==parseInt($routeParams.anio)){
                  $scope.anio = parseInt($routeParams.anio);
                  $scope.e.anioIndex=i;
                  $scope.eleccion = a;
                  $scope.eleccion.fecha = $scope.eleccion.descripcion;
                  return true;
                }
              });
          $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
          return;
        });
      } else {
        getAnios(function(){
          $scope.eleccion = $scope.aniosLista[$scope.e.anioIndex];
          $scope.currentDpa.idTipoEleccion = $scope.eleccion.tipos_eleccion[0].id_tipo_eleccion;
          $scope.currentDpa.idTipoDpa = $scope.eleccion.tipos_eleccion[0].id_tipos_dpa[0];
          $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
        });
      }
    });

    // Crear tabla partidos 
    $scope.getPartidosTable = function(){
      var pdatos = [{ //id:'id',
                      //color:'color',
                      sigla:'sigla',
                      nombre:'partido',
                      votos:'votos',
                      porcentaje:'porcentaje'}];
      $scope.partidos.forEach(function(p){
        var d = new Object();
        //d.id = p.id_partido;
        //d.color = p.color;
        d.sigla = p.sigla;
        d.nombre = p.partido_nombre;
        d.votos = p.resultado;
        d.porcentaje = p.porcentaje;
        pdatos.push(d);
      });
      return pdatos;
    }

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
    $scope.getEleccion = function() {
      var tipoElec;
      switch($scope.currentDpa.idTipoEleccion){
        case 1: tipoElec='Generales'; break
        case 2: tipoElec='Generales'; break
        case 6: tipoElec='Departamentales'; break
        case 7: tipoElec='Municipales'; break
        case 8: tipoElec='Departamentales (2da.Vuelta)'; break
        default: tipoElec='Generales';
      }
      return tipoElec;
    }

    // Establecer el año
    $scope.setAnioIndex = function (index) {
      //$scope.partidoSeleccionado = null;
      $scope.e.anioIndex = index;
      $scope.anio = $scope.anios[$scope.e.anioIndex];
      $scope.aniosLista.some(function(adet){
        if(adet.anio==$scope.anio){
          var ite=0;
          adet.tipos_eleccion.some(function(tEle,i){
            if(tEle.id_tipo_eleccion==$scope.currentDpa.idTipoEleccion){
              ite=i;
              return true;
            }
          });
          $scope.currentDpa.idTipoEleccion=adet.tipos_eleccion[ite].id_tipo_eleccion;
          if( adet.tipos_eleccion[ite].id_tipos_dpa.indexOf($scope.currentDpa.idTipoDpa)<0 ){
            switch(adet.tipos_eleccion[ite].id_tipo_eleccion){
              case 1:
                $scope.currentDpa.idTipoDpa=adet.tipos_eleccion[ite].id_tipos_dpa[1];
                $scope.currentDpa.idTipoEleccion=adet.tipos_eleccion[ite].id_tipo_eleccion;
                break;
              case 2:
              case 6:
              case 7:
                $scope.currentDpa.idTipoDpa=adet.tipos_eleccion[ite].id_tipos_dpa[0];
                $scope.currentDpa.idTipoEleccion=adet.tipos_eleccion[ite].id_tipo_eleccion;
                break;
            }
          }
          return true;
        }
      });
      $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
    };

    // Establecer el tipo de dpa para mostrar en el mapa
    $scope.setTipoDpa = function (idTipoDpa,idTipoEleccion) {
      if(idTipoEleccion) $scope.currentDpa.idTipoEleccion = idTipoEleccion;

      var dpaPadres = Dpa.idDpasPadre($scope.currentDpa.idDpa);
      if((idTipoDpa==5 && $scope.currentDpa.idTipoDpaActual>=3)){
        $scope.currentDpa.idDpa= dpaPadres[dpaPadres.length-2];
      }
      if (idTipoDpa < $scope.currentDpa.idTipoDpaActual) {
        $scope.currentDpa.idDpa=dpaPadres[0];
      }
      $scope.currentDpa.idTipoDpa = idTipoDpa;
      recargarMapa();
    };
    $scope.getTipoDpa = function () {
      return $scope.currentDpa.idTipoDpa;
    };

    // Establecer el tipo de elección: plurinominal, uninominal
    $scope.setTipoEleccion = function (idTipoEleccion) {
      $scope.currentDpa.idTipoEleccion = idTipoEleccion;
      recargarMapa();
    };
    $scope.getTipoEleccion = function () {
      return $scope.currentDpa.idTipoEleccion;
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
      if ($scope.partidoSeleccionado && $scope.partidoSeleccionado.id_partido === $scope.partidos[index].id_partido) {
        $scope.partidoSeleccionado = null;
      } else {
        $scope.partidoSeleccionado = $scope.partidos[index];
      }
    };

    // Funciones
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
      partidos.forEach(function (p, i) {
        if (p.sigla === 'VALIDOS') {
          partidos.splice(i, 1);
        }
      });
      // para llevar a api.
      partidos.forEach(function (p, i) {
        if (p.sigla === 'EMITIDOS') {
          partidos.splice(i, 1);
        }
      });
      partidos.forEach(function (p, i) {
        if (p.sigla === 'INSCRITOS') {
          partidos.splice(i, 1);
        }
      });
      partidos.forEach(function (p, i) {
        if (p.sigla === 'BLANCOS') {
          partidos.splice(i, 1);
        }
      });
      partidos.forEach(function (p, i) {
        if (p.sigla === 'NULOS') {
          partidos.splice(i, 1);
        }
      });
      return partidos;
    };
    var establecerColorValidos = function(dpas) {
      return dpas.map(function(d) {
        d.partidos = eliminarValidos(d.partidos);
        return d;
      });
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
    // TODO: Esta función debería trasladarse al GeoElectoral API
    var reducePorAnio = function (dpas) {
      var p, fecha, fechaCreacion, fechaSupresion, features, anioCreacion, anioSupresion;
      features = [];
      fecha = new Date($scope.eleccion.fecha.replace(/T.+$/, ''));
      dpas.data.features.forEach(function (d, i) {
        p = d.properties;
        p.fecha_creacion_corte=p.fecha_creacion_corte.replace('Z','');
        p.fecha_supresion_corte=p.fecha_supresion_corte.replace('Z','');
        fechaCreacion = Date.parse(p.fecha_creacion_corte);
        fechaSupresion = Date.parse(p.fecha_supresion_corte);
        anioCreacion =  Number.NEGATIVE_INFINITY;
        anioSupresion =  Number.POSITIVE_INFINITY;
        if (isFinite(fechaCreacion)) {
          anioCreacion = new Date(fechaCreacion);
        }
        if (isFinite(fechaSupresion)) {
          anioSupresion = new Date(fechaSupresion);
        }
        if (anioCreacion <= fecha && fecha <= anioSupresion) {
          features.push(d);
        }
      });
      dpas.data.features = features;
      return dpas;
    };
    var loadServices = function() {
      var promises = [];
      // GeoJSON político administrativo de Bolivia
      $scope.currentDpa.lz=1;
      promises.push($http.get(dpaGeoJSONUrl, { params: $scope.currentDpa }));
      // Elecciones a nivel departamento
      promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                                                .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                                                .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));
      promises.push($http.get(eleccionesUrl.replace(/{anio}/g, $scope.anio)
                                           .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                                           .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpaActual)
                                           .replace(/{idDpa}/g, $scope.currentDpa.idDpa)));

      $q.all(promises).then(function(response) {
        if(response[0].data.lz){
          var lzData = LZString.decompressFromEncodedURIComponent(response[0].data.lz);
          response[0].data=JSON.parse(lzData);
        }
        if(response[0].data.features.length==0){
          $scope.mapControl.ajustar=true;
          var idDpa =Dpa.idDpasPadre($scope.currentDpa.idDpa)[0];
          $scope.currentDpa.idDpa=idDpa?idDpa:1;
          return;
        }
        if (response[1].data.dpas && response[1].data.eleccion) {
          //$scope.eleccion = response[1].data.eleccion;
          $scope.dpaGeoJSON = reducePorAnio(response[0]);
          $scope.partidosDepartamento = establecerColorValidos(response[1].data.dpas);
          $scope.partidosDepartamento = reducirDpasVista($scope.partidosDepartamento);
          if( response[2].data.dpas && response[2].data.dpas[0].partidos ){
            $scope.partidos = eliminarValidos(response[2].data.dpas[0].partidos);
          }
          else{
            $scope.partidos = sumarValidos(response[1].data.dpas,response[0].data.features);
          }
          $scope.partidos = $scope.partidos.sort(function(a, b) { return b.resultado - a.resultado; });
        } else {
            //growl.warning("No hay datos de elecciones disponibles.",{});
            $scope.tiposDpa.some(function(tDpa){
              if(tDpa.idTipoDpa == $scope.currentDpa.idTipoDpa){
                $scope.currentDpa.idTipoDpa = tDpa.idTipoDpaSuperior;
                loadServices();
                return true;
              }
            });
        }
      }, function(error) {
        console.warn("Error en la conexión a GeoElectoral API");
      });
    };
    // Cuando se cambia el tipo de dpa: Departamento, provincia, municipio, y circunscripción
    var recargarMapa = function() {
      var promises = [];
      // GeoJSON político administrativo de Bolivia
      $scope.currentDpa.lz=1;
      promises.push($http.get(dpaGeoJSONUrl, { params: $scope.currentDpa }));
      // Elecciones a nivel departamento
      promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                                                .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                                                .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));
      promises.push($http.get(eleccionesUrl.replace(/{anio}/g, $scope.anio)
                                           .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                                           .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpaActual)
                                           .replace(/{idDpa}/g, $scope.currentDpa.idDpa)));

      $q.all(promises).then(function(response) {
        if(response[0].data.lz){
          var lzData = LZString.decompressFromEncodedURIComponent(response[0].data.lz);
          response[0].data=JSON.parse(lzData);
        }
        if (response[1].data.dpas) {
          $scope.dpaGeoJSON = reducePorAnio(response[0]);
          $scope.partidosDepartamento = establecerColorValidos(response[1].data.dpas);
          $scope.partidosDepartamento = reducirDpasVista($scope.partidosDepartamento);
          if( response[2].data.dpas && response[2].data.dpas[0].partidos ){
            $scope.partidos = eliminarValidos(response[2].data.dpas[0].partidos);
          }
          else{
            $scope.partidos = sumarValidos(response[1].data.dpas,response[0].data.features);
          }
          $scope.partidos = $scope.partidos.sort(function(a, b) { return b.resultado - a.resultado; });
        } else {
          growl.info("No hay datos de elecciones disponibles", {});
        }
      }, function(error) {
        console.warn("Error en la conexión a GeoElectoral API");
      });
    };
    $scope.recargarMapa = recargarMapa;

    // Sumar el total de votos por partido cuando se muestran varios dpas
    var sumarValidos = function(dpas,features) {
      var totalPartidos = [];
      var totalVotos=0;
      var totalVotosP=0;
      if(dpas)
        dpas.forEach(function(dpa){
          //if(dpa.id_dpa_superior==$scope.currentDpa.idDpa || $scope.currentDpa.idDpa==1)
          if( features.some(function(feat){
            return feat.properties.id_dpa==dpa.id_dpa;
              }) )
          dpa.partidos.forEach(function (p, i) {
            if (p.sigla === 'VALIDOS') {
              totalVotos += p.resultado;
            } else {
              var c=0;
              totalVotosP += p.resultado;
              totalPartidos.forEach(function (totalp,i){
                if(totalp.id_partido===p.id_partido){
                  totalPartidos[i].resultado += p.resultado;
                  return;
                }
                c++;
              });
              if(c==totalPartidos.length) {
                totalPartidos.push(p);
              }
            }
          });
        });
        totalPartidos.forEach(function (totalp,i){
          totalPartidos[i].porcentaje = parseInt(totalp.resultado / totalVotosP * 10000)/100;
        });
        return totalPartidos;
    }

  });
