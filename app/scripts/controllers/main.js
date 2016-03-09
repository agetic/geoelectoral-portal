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
            var eleccionesUrl2 = host + api + '/elecciones2?anio={anio}&id_tipo_dpa={idTipoDpa}&id_dpa={idDpa}&id_tipo_eleccion={idTipoEleccion}&formato=json';
            var eleccionesDeptoUrl = host + api + '/elecciones?anio={anio}&id_tipo_dpa={idTipoDpa}&id_dpa={idDpa}&id_tipo_eleccion={idTipoEleccion}&formato=json';
            var dpaGeoJSONUrl = host + api + '/proxy';

            var primeraVez = true; // Variable para simular entrada por primera vez al sistema (/)

            $scope.mapControl = {ajustar: true};
            $scope.date = new Date();

            $scope.anios = [1979, 1980, 1985, 1989, 1993, 1997, 2002, 2005, 2009, 2014].reverse();
            $scope.aniosLista = null;
            $scope.tiposDpa = [
                {idTipoDpa: 1, nombre: 'país', idTipoDpaSuperior: null},
                {idTipoDpa: 2, nombre: 'departamento', idTipoDpaSuperior: 1},
                {idTipoDpa: 3, nombre: 'provincia', idTipoDpaSuperior: 2},
                {idTipoDpa: 4, nombre: 'municipio', idTipoDpaSuperior: 3},
                {idTipoDpa: 5, nombre: 'circunscripción', idTipoDpaSuperior: 2},
                {idTipoDpa: 6, nombre: 'recinto', idTipoDpaSuperior: 4},
                {idTipoDpa: 8, nombre: 'cir_recinto', idTipoDpaSuperior: 5}
            ];
            $scope.partidoSeleccionado = null;
            $scope.e = {};
            $scope.anio = $scope.anios[$scope.e.anioIndex];
            $scope.partidos = [];
            $scope.datosGrales = [];
            $scope.partidosDepartamento = [];
            $scope.eleccion = null;
            $scope.dpaGeoJSON = [];
            $scope.gris = ENV.color;
            $scope.porcetajeGroup = 3; // 3% Porcentaje de agrupación
            $scope.currentDpa = {
                idDpa: 1, // Dpa que se está mostrando actualmente
                idTipoDpaActual: 1, // Tipo de Dpa del dpa actual
                idTipoEleccion: 1, // Tipo de la Elección: plurinominal, uninominal
                dpaNombre: 'Bolivia', // Nombre del dpa actual
                idTipoDpa: null       // Tipo de Dpa hijos que se va mostrar
            };
            $scope.e = {anioIndex: $scope.anios.length - 1,
                anteriorDpa: angular.copy($scope.currentDpa)};
            $scope.ctiposDpa = {};

            var breadcrumbFactory = function () {
                BreadcrumbFactory.fromDpa('mapa-breadcrumb', Dpa.breadcrumb($scope.currentDpa.idDpa), $scope.anio);
            };

            // Se ejecuta cuando se hace clic a un departamento, provincia, ...
            $scope.$watch('currentDpa.idDpa', function (newVal, oldVal) {
                if (newVal != oldVal) {
                    $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
                }
            });

            // Obtener anios y sus respectivas elecciones
            function getAnios(callback) {
                if (!$scope.aniosLista) {
                    $http.get(host + api + "/anios").then(function (response) {
                        $scope.aniosLista = response.data.anios.reverse();
                        if ($scope.aniosLista[0].anio) {
                            for (var a in $scope.aniosLista)
                                $scope.anios[a] = $scope.aniosLista[a].anio;
                            $scope.e = {anioIndex: 0};
                            $scope.anio = $scope.anios[0];
                            $scope.eleccion = $scope.aniosLista[0];
                            //$scope.eleccion.fecha = $scope.eleccion.descripcion;
                        }
                        callback();
                    });
                } else {
                    callback();
                }
            }
            // Se ejecuta cuando hay cambios en la URL
            $scope.$on('$routeChangeSuccess', function () {
                if ($routeParams.anio && $routeParams.idDpa) {
                    if (isNaN(parseInt($routeParams.idDpa))) {
                        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
                        return;
                    }
                    getAnios(function () {
                        $scope.currentDpa.idDpa = parseInt($routeParams.idDpa);
                        if (!$scope.aniosLista.some(function (a, i) {
                            if (a.anio == parseInt($routeParams.anio)) {
                                $scope.anio = parseInt($routeParams.anio);
                                $scope.e.anioIndex = i;
                                $scope.eleccion = a;
                                //$scope.eleccion.fecha = $scope.eleccion.descripcion;
                                return true;
                            }
                        })
                                ) {
                            $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
                            return;
                        }
                        // ver si existe el tipo eleccion y tipo dpa.
                        var iEleccion = 0, iTipoDpa = 0;
                        $scope.eleccion.tipos_eleccion.some(function (el, i) {
                            if (el.id_tipo_eleccion == $scope.currentDpa.idTipoEleccion) {
                                iEleccion = i;
                                return true;
                            }
                        });
                        $scope.currentDpa.idTipoEleccion = $scope.eleccion.tipos_eleccion[iEleccion].id_tipo_eleccion;
                        $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa.some(function (idt, i) {
                            if (idt == $scope.currentDpa.idTipoDpa) {
                                iTipoDpa = i;
                                return true;
                            }
                        });
                        if ($scope.currentDpa.idTipoDpa == null &&
                                $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa[iTipoDpa + 1])
                            $scope.currentDpa.idTipoDpa = $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa[iTipoDpa + 1];
                        else
                            $scope.currentDpa.idTipoDpa = $scope.eleccion.tipos_eleccion[iEleccion].id_tipos_dpa[iTipoDpa];
                        Dpa.query($scope.eleccion.fecha).then(function (data) {
                            var _dpa = Dpa.find($scope.currentDpa.idDpa);
                            if (_dpa) {
                                $scope.currentDpa.idTipoDpaActual = _dpa.id_tipo_dpa;
                                $scope.currentDpa.dpaNombre = _dpa.nombre;
                                if ($scope.currentDpa.idTipoDpa < $scope.currentDpa.idTipoDpaActual) {
                                    $scope.currentDpa.idTipoDpa = $scope.currentDpa.idTipoDpaActual;
                                }
                            }
                            // Por ahora no se muestran las mesas
                            if ($scope.currentDpa.idTipoDpa == 7)
                                $scope.currentDpa.idTipoDpa = 6;
                            if ($scope.currentDpa.idTipoDpa == 9)
                                $scope.currentDpa.idTipoDpa = 8;
                            // Por ahora no se muestran los recintos en toda Bolivia
                            if ($scope.currentDpa.idTipoDpaActual == 1 && $scope.currentDpa.idTipoDpa == 8)
                                $scope.currentDpa.idTipoDpa = 5;
                            if ($scope.currentDpa.idTipoDpaActual == 1 && $scope.currentDpa.idTipoDpa == 6)
                                $scope.currentDpa.idTipoDpa = 4;

                            $scope.mapControl.ajustar = true;
                            loadServices();
                            breadcrumbFactory();
                        });
                        // Tipo dpa actual para divisiones
                        $scope.aniosLista.forEach(function (l) {
                            if (l.anio == $scope.anio) {
                                l.tipos_eleccion.forEach(function (t) {
                                    if (t.id_tipo_eleccion == $scope.currentDpa.idTipoEleccion) {
                                        $scope.ctiposDpa = t;
                                    }
                                });
                            }
                        });

                    });
                } else if ($routeParams.anio) {
                    getAnios(function () {
                        $scope.aniosLista.some(function (a, i) {
                            if (a.anio == parseInt($routeParams.anio)) {
                                $scope.anio = parseInt($routeParams.anio);
                                $scope.e.anioIndex = i;
                                $scope.eleccion = a;
                                //$scope.eleccion.fecha = $scope.eleccion.descripcion;
                                return true;
                            }
                        });
                        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
                        return;
                    });
                } else {
                    getAnios(function () {
                        $scope.eleccion = $scope.aniosLista[$scope.e.anioIndex];
                        $scope.currentDpa.idTipoEleccion = $scope.eleccion.tipos_eleccion[0].id_tipo_eleccion;
                        $scope.currentDpa.idTipoDpa = $scope.eleccion.tipos_eleccion[0].id_tipos_dpa[0];
                        $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
                    });
                }
            });

            // Crear tabla partidos
            $scope.getPartidosTable = function () {
                var dpa = 'dpa';
                $scope.tiposDpa.some(function (t) {
                    if (t.idTipoDpa == $scope.currentDpa.idTipoDpaActual) {
                        dpa = t.nombre;
                        return true;
                    }
                });
                var pdatos = [{//id:'id',
                        //color:'color',
                        dpa: dpa,
                        votos: 'votos',
                        porcentaje: 'porcentaje',
                        sigla: 'sigla',
                        nombre: 'partido'}];
                $scope.partidos.forEach(function (p) {
                    var d = new Object();
                    //d.id = p.id_partido;
                    //d.color = p.color;
                    d.dpa = $scope.currentDpa.dpaNombre;
                    d.votos = p.resultado;
                    d.porcentaje = p.porcentaje;
                    d.sigla = p.sigla;
                    d.nombre = p.partido_nombre;
                    pdatos.push(d);
                });
                return pdatos;
            }


            // Crear tabla con los datos del mapa mostrado actualmente
            $scope.getDpaTable = function () {
                var dpa = 'dpa';
                $scope.tiposDpa.some(function (t) {
                    if (t.idTipoDpa == $scope.currentDpa.idTipoDpa) {
                        dpa = t.nombre;
                        return true;
                    }
                });
                var pdatos = [{//id:'id',
                        //color:'color',
                        dpa: dpa,
                        votos: 'votos',
                        porcentaje: 'porcentaje',
                        sigla: 'sigla',
                        nombre: 'partido'}];
                $scope.partidosDepartamento.forEach(function (pD) {
                    pD.partidos.sort(function (a, b) {
                        return a.resultado < b.resultado;
                    });
                    pD.partidos.forEach(function (p) {
                        var d = new Object();
                        //d.id = p.id_partido;
                        //d.color = p.color;
                        d.dpa = pD.dpa_nombre;
                        d.votos = p.resultado;
                        d.porcentaje = p.porcentaje;
                        d.sigla = p.sigla;
                        d.nombre = p.partido_nombre;
                        pdatos.push(d);
                    });
                });
                return pdatos;
            }
            // Hover sobre las filas de la tabla
            $scope.hoverIn = function () {
                jQuery('.tooltip-tabla').tooltip();
            };

            // Establecer el título para la ubicación en el mapa
            $scope.getLugar = function () {
                var titulo = $scope.currentDpa.dpaNombre;
                if ($scope.currentDpa.idDpa > 1) {
                    $scope.tiposDpa.some(function (e) {
                        if (e.idTipoDpa === $scope.currentDpa.idTipoDpaActual) {
                            titulo = capitalize(e.nombre) + ' ' + titulo;
                            return true;
                        }
                    });
                }
                return titulo;
            };
            $scope.getNombreTipoEleccion = function (idTipoEleccion) {
                var tipo = '';
                switch (idTipoEleccion) {
                    case 1:
                        tipo = 'Elecciones Plurinominales';
                        break;
                    case 2:
                        tipo = 'Elecciones Uninominales';
                        break;
                    case 3:
                        tipo = 'Elecciones Circunscripciones Especiales';
                        break;
                    case 4:
                        tipo = 'Elecciones Constituyentes Plurinominales';
                        break;
                    case 5:
                        tipo = 'Elecciones Constituyentes Uninominales';
                        break;
                    case 6:
                        tipo = 'Elecciones Departamentales';
                        break;
                    case 7:
                        tipo = 'Elecciones Municipales';
                        break;
                    case 8:
                        tipo = 'Elecciones Departamentales 2da Vuelta';
                        break;
                    case 9:
                        tipo = 'Elecciones Regionales Subgobernador';
                        break;
                    case 10:
                        tipo = 'Elecciones Regionales Corregidor Municipal';
                        break;
                    case 11:
                        tipo = 'Elecciones Regionales Ejecutivo Seccional';
                        break;
                    case 12:
                        tipo = 'Elecciones Asambleista Departamental por Territorio (Provincias)';
                        break;
                    case 13:
                        tipo = 'Elecciones Asambleista Departamental por Territorio (Municipios)';
                        break;
                    case 14:
                        tipo = 'Elecciones Asambleista Departamental por Población (Departamentos)';
                        break;
                    case 15:
                        tipo = 'Elecciones Asambleista Departamental por Población (Municipios)';
                        break;
                    case 16:
                        tipo = 'Elecciones Asambleista Departamental por Población 2da Vuelta (Municipios)';
                        break;
                    case 17:
                        tipo = 'Referendo Autonómico Departamental';
                        break;
                    case 18:
                        tipo = 'Referendo Autonómico Municipal';
                        break;
                    case 19:
                        tipo = 'Referendo Autonómico Regional';
                        break;
                    case 20:
                        tipo = 'Referendo Revocatorio de Mandato del Presidente y Vicepresidente';
                        break;
                    case 21:
                        tipo = 'Referendo Revocatorio de Mandato de Prefectos';
                        break;
                    case 22:
                        tipo = 'Elecciones Judiciales Tribunal Agroambiental';
                        break;
                    case 23:
                        tipo = 'Elecciones Judiciales Consejo de la Magistratura';
                        break;
                    case 24:
                        tipo = 'Elecciones Judiciales Tribunal Constitucional';
                        break;
                    case 25:
                        tipo = 'Elecciones Judiciales Tribunal Supremo de Justicia';
                        break;
                    case 26:
                        tipo = 'Referendo Constitucional al 99,81% - OEP';
                        break;
                }
                //tipo=tipo.replace(' ',' ');
                if ($scope.anio < 1995) // Hasta 1994 Elecciones Generales
                    tipo = tipo.replace('Plurinominales', 'Generales');
                return tipo;
            };
            $scope.getEleccion = function () {
                var tipoElec;
                return $scope.getNombreTipoEleccion($scope.currentDpa.idTipoEleccion);
            }

            // Establecer el año
            $scope.setAnioIndex = function (index) {
                //$scope.partidoSeleccionado = null;
                $scope.e.anioIndex = index;
                $scope.anio = $scope.anios[$scope.e.anioIndex];
                $scope.aniosLista.some(function (adet) {
                    if (adet.anio == $scope.anio) {
                        var ite = 0;
                        adet.tipos_eleccion.some(function (tEle, i) {
                            if (tEle.id_tipo_eleccion == $scope.currentDpa.idTipoEleccion) {
                                ite = i;
                                return true;
                            }
                        });
                        $scope.currentDpa.idTipoEleccion = adet.tipos_eleccion[ite].id_tipo_eleccion;
                        if (adet.tipos_eleccion[ite].id_tipos_dpa.indexOf($scope.currentDpa.idTipoDpa) < 0) {
                            switch (adet.tipos_eleccion[ite].id_tipo_eleccion) {
                                case 1:
                                    $scope.currentDpa.idTipoDpa = adet.tipos_eleccion[ite].id_tipos_dpa[1];
                                    $scope.currentDpa.idTipoEleccion = adet.tipos_eleccion[ite].id_tipo_eleccion;
                                    break;
                                case 2:
                                case 6:
                                case 7:
                                    $scope.currentDpa.idTipoDpa = adet.tipos_eleccion[ite].id_tipos_dpa[0];
                                    $scope.currentDpa.idTipoEleccion = adet.tipos_eleccion[ite].id_tipo_eleccion;
                                    break;
                            }
                        }
                        return true;
                    }
                });
                $location.path('/elecciones/' + $scope.anio + '/dpa/' + $scope.currentDpa.idDpa);
            };

            // Establecer el tipo de dpa para mostrar en el mapa
            $scope.setTipoDpa = function (idTipoDpa, idTipoEleccion) {
                $scope.e.anteriorDpa = angular.copy($scope.currentDpa);
                if (idTipoEleccion)
                    $scope.currentDpa.idTipoEleccion = idTipoEleccion;

                var dpaPadres = Dpa.idDpasPadre($scope.currentDpa.idDpa);
                if ((idTipoDpa == 5 && $scope.currentDpa.idTipoDpaActual >= 3)) {
                    $scope.currentDpa.idDpa = dpaPadres[dpaPadres.length - 2];
                }
                if (idTipoDpa < $scope.currentDpa.idTipoDpaActual) {
                    $scope.currentDpa.idDpa = dpaPadres[0];
                }
                $scope.currentDpa.idTipoDpa = idTipoDpa;
                recargarMapa();
            };
            $scope.getTipoDpa = function () {
                return $scope.currentDpa.idTipoDpa;
            };

            // Establecer el tipo de elección: plurinominal, uninominal
            $scope.setTipoEleccion = function (idTipoEleccion) {
                $scope.e.anteriorDpa = angular.copy($scope.currentDpa);
                $scope.currentDpa.idTipoEleccion = idTipoEleccion;
                $scope.aniosLista.forEach(function (l) {
                    if (l.anio == $scope.anio) {
                        l.tipos_eleccion.forEach(function (t) {
                            if (t.id_tipo_eleccion == $scope.currentDpa.idTipoEleccion) {
                                // Verificar si existe el tipo dpa actual
                                if (!t.id_tipos_dpa.some(function (td) {
                                    if (td == $scope.currentDpa.idTipoDpa)
                                        return true;
                                })) {
                                    $scope.currentDpa.idTipoDpa = t.id_tipos_dpa[0];
                                    if (t.id_tipos_dpa[0] == 1)
                                        $scope.currentDpa.idTipoDpa = t.id_tipos_dpa[1];
                                }

                                $scope.ctiposDpa = t;
                            }
                        });
                    }
                });
                recargarMapa();
            };
            $scope.getTipoEleccion = function () {
                return $scope.currentDpa.idTipoEleccion;
            };

            // Establecer clases para la bandera
            $scope.establecerClases = function (partido) {
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
            $scope.seleccionarPartido = function (index) {
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
                    //p.porcentaje = Math.ceil((p.resultado / total) * 100 * 100) / 100;
                    p.porcentaje = 0;
                });
                return partidos;
            };
            var capitalize = function (string) {
                return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
            };


            var eliminarValidos = function (partidos) {
                // TODO eliminar cuando cambie la fecha
                // BEGIN Provisional verificar en la observación sólo del 2016
                function esPartidoDel2016(p) {
                    return /24-02-2016/.exec(p.observacion);
                }
                if (partidos.some(esPartidoDel2016)) {
                    return partidos
                }
                // END Provisional verificar en la observación sólo del 2016
                partidos.forEach(function (p, i) {
                    if (p.sigla === 'VALIDOS') {
                        partidos.splice(i, 1);
                    }
                });
                // Nombres de candidatos en elecciones judiciales
                partidos.forEach(function (p, i) {
                    if (($scope.currentDpa.idTipoEleccion == 22
                            || $scope.currentDpa.idTipoEleccion == 23
                            || $scope.currentDpa.idTipoEleccion == 24
                            || $scope.currentDpa.idTipoEleccion == 25)) {
                        // Verificar nombre de candidato
                        if (!p.observacion) {
                            p.candidato = '';
                            return;
                        }
                        var cnombre = p.observacion.split(' ');
                        p.candidato = '- ';
                        if (cnombre.length < 4)
                            p.candidato += cnombre[0] + ' ' + cnombre[1];
                        else
                            p.candidato += cnombre[0] + ' ' + cnombre[1][0] + '. ' + cnombre[2];
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
            var establecerColorValidos = function (dpas) {
                return dpas.map(function (d) {
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
                }
                ;
                return votosDpa;
            };

            /**
             * Funcion que se conecta con el segundo método de ws que obtiene los tipo de partido (2,3,4,5)
             * Nulos, blancos,emitidos,validos,inscritos
             *
             */
            var armarTablaDatosGenerales = function () {
                var promises = [];
                var partidosInformacionGeneral=[];
                var partidosPorSigla=[];

                $scope.mostrarDatosGenerales=true;
                promises.push($http.get(eleccionesUrl2.replace(/{anio}/g, $scope.anio)
                        .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                        .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpaActual)
                        .replace(/{idDpa}/g, $scope.currentDpa.idDpa)));

                        // validacion para saber si tenemos resultados

                        if(promises.length==0){
                          $scope.mostrarDatosGenerales=false;
                          return ;
                        }
                $q.all(promises).then(function (response) {

                  //validamos si existe algun dato en dpas de lo contrario no retornamos nada.
                        if(typeof response[0] == "undefined"||typeof response[0].data.dpas == "undefined")
                        {
                          $scope.mostrarDatosGenerales=false;
                          return ;

                        }
                    var arrayPartidos=response[0].data.dpas[0].partidos;
                    arrayPartidos.forEach(function (partido,i){
                        //partido.sigla="TOTAL "+partido.sigla;
                        partidosPorSigla[partido.sigla]=partido;
                    });

                    var arrayAuxiliar=[];
                    for(var i in partidosPorSigla)
                        {
                          if(i === 'INSCRITOS' || i === 'EMITIDOS' || i === 'ABSTENCION')
                            partidosPorSigla[i].porcentaje= partidosPorSigla[i].resultado*100/partidosPorSigla['INSCRITOS'].resultado;
                          else {
                            partidosPorSigla[i].porcentaje= partidosPorSigla[i].resultado*100/partidosPorSigla['EMITIDOS'].resultado;
                          }
                            //console.log(partidosPorSigla[i]);
                            arrayAuxiliar.push(partidosPorSigla[i]);
                          }
                          $scope.datosGrales=partidosPorSigla;


                }, function (error) {
                    console.warn("Error en la conexión a GeoElectoral API");
                });


            };
            // TODO: Esta función debería trasladarse al GeoElectoral API
            var reducePorAnio = function (dpas) {
                var p, fecha, fechaCreacion, fechaSupresion, features, anioCreacion, anioSupresion;
                features = [];
                fecha = new Date($scope.eleccion.fecha.replace(/T.+$/, ''));
                dpas.data.features.forEach(function (d, i) {
                    p = d.properties;
                    p.fecha_creacion_corte = p.fecha_creacion_corte.replace('Z', '');
                    p.fecha_supresion_corte = p.fecha_supresion_corte.replace('Z', '');
                    fechaCreacion = Date.parse(p.fecha_creacion_corte);
                    fechaSupresion = Date.parse(p.fecha_supresion_corte);
                    anioCreacion = Number.NEGATIVE_INFINITY;
                    anioSupresion = Number.POSITIVE_INFINITY;
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
            var loadServices = function () {
                var promises = [];
                var promises2 = [];
                // GeoJSON político administrativo de Bolivia
                $scope.currentDpa.lz = 1;
                $scope.currentDpa.fecha = $scope.eleccion.fecha;

                // BEGIN Cambiar el estado de tipoDpa (TODO: provisional hasta encontrar la forma correcta)
                if (primeraVez) {
                    switch ($scope.currentDpa.idTipoEleccion) {
                        case 26: // Referendo Constitucional 2016
                            $scope.currentDpa.idTipoDpa = 2;
                            primeraVez = false;
                            break;
                    }
                    primeraVez = false;
                }
                // END Cambiar el estado de tipoDpa (TODO: provisional hasta encontrar la forma correcta)

                promises.push($http.get(dpaGeoJSONUrl, {params: $scope.currentDpa}));
                // Elecciones a nivel departamento
                promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                        .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                        .replace(/{idDpa}/g, $scope.currentDpa.idDpa)
                        .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));
                promises.push($http.get(eleccionesUrl.replace(/{anio}/g, $scope.anio)
                        .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                        .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpaActual)
                        .replace(/{idDpa}/g, $scope.currentDpa.idDpa)));
                //obtenemos los datos del segundo webservice
                armarTablaDatosGenerales();

                $q.all(promises).then(function (response) {
                    if (response[0].data.lz) {
                        var lzData = LZString.decompressFromEncodedURIComponent(response[0].data.lz);
                        response[0].data = JSON.parse(lzData);
                    }
                    if (response[0].data.features.length == 0) {
                        $scope.mapControl.ajustar = true;
                        var idDpa = Dpa.idDpasPadre($scope.currentDpa.idDpa)[0];
                        $scope.currentDpa.idDpa = idDpa ? idDpa : 1;
                        return;
                    }
                    if (response[1].data.dpas && response[1].data.eleccion) {
                        if (!$scope.eleccion.fecha)
                            $scope.eleccion.fecha = response[1].data.eleccion.fecha;
                        if (response[2].data.dpas) { // En vista recintos adicionar el dpa superior
                            response[1].data.dpas.push(response[2].data.dpas[0]);
                        }
                        //$scope.eleccion = response[1].data.eleccion;
                        $scope.dpaGeoJSON = reducePorAnio(response[0]);
                        $scope.partidosDepartamento = establecerColorValidos(response[1].data.dpas);
                        $scope.partidosDepartamento = reducirDpasVista($scope.partidosDepartamento);
                        if (response[2].data.dpas && response[2].data.dpas[0].partidos) {
                            $scope.partidos = eliminarValidos(response[2].data.dpas[0].partidos);
                        } else {
                            $scope.partidos = sumarValidos(response[1].data.dpas, response[0].data.features);
                        }
                        $scope.partidos = $scope.partidos.sort(function (a, b) {
                            return b.resultado - a.resultado;
                        });
                    } else {
                        //growl.warning("No hay datos de elecciones disponibles.",{});
                        $scope.tiposDpa.some(function (tDpa) {
                            if (tDpa.idTipoDpa == $scope.currentDpa.idTipoDpa) {
                                $scope.currentDpa.idTipoDpa = tDpa.idTipoDpaSuperior;
                                loadServices();
                                return true;
                            }
                        });
                    }
                }, function (error) {
                    console.warn("Error en la conexión a GeoElectoral API");
                });
            };
            // Cuando se cambia el tipo de dpa: Departamento, provincia, municipio, y circunscripción
            var recargarMapa = function () {
                var promises = [];
                // GeoJSON político administrativo de Bolivia
                $scope.currentDpa.lz = 1;
                $scope.currentDpa.fecha = $scope.eleccion.fecha;
                promises.push($http.get(dpaGeoJSONUrl, {params: $scope.currentDpa}));
                // Elecciones a nivel departamento
                promises.push($http.get(eleccionesDeptoUrl.replace(/{anio}/g, $scope.anio)
                        .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                        .replace(/{idDpa}/g, $scope.currentDpa.idDpa)
                        .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpa)));
                promises.push($http.get(eleccionesUrl.replace(/{anio}/g, $scope.anio)
                        .replace(/{idTipoEleccion}/g, $scope.currentDpa.idTipoEleccion)
                        .replace(/{idTipoDpa}/g, $scope.currentDpa.idTipoDpaActual)
                        .replace(/{idDpa}/g, $scope.currentDpa.idDpa)));
                 armarTablaDatosGenerales();

                $q.all(promises).then(function (response) {
                    if (response[0].data.lz) {
                        var lzData = LZString.decompressFromEncodedURIComponent(response[0].data.lz);
                        response[0].data = JSON.parse(lzData);
                    }
                    if (response[1].data.dpas) {
                        if (!$scope.eleccion.fecha)
                            $scope.eleccion.fecha = response[1].data.eleccion.fecha;
                        if (response[2].data.dpas) { // En vista recintos adicionar el dpa superior
                            response[1].data.dpas.push(response[2].data.dpas[0]);
                        }
                        $scope.dpaGeoJSON = reducePorAnio(response[0]);
                        $scope.partidosDepartamento = establecerColorValidos(response[1].data.dpas);
                        $scope.partidosDepartamento = reducirDpasVista($scope.partidosDepartamento);
                        if (response[2].data.dpas && response[2].data.dpas[0].partidos) {
                            $scope.partidos = eliminarValidos(response[2].data.dpas[0].partidos);

                        } else {
                            $scope.partidos = sumarValidos(response[1].data.dpas, response[0].data.features);
                        }
                        $scope.partidos = $scope.partidos.sort(function (a, b) {
                            return b.resultado - a.resultado;
                        });
                    } else {
                        growl.warning("Para la vista actual no existen datos para la elección que desea ver. . .", {});
                        $scope.currentDpa = angular.copy($scope.e.anteriorDpa);
                        // Tipo dpa actual para divisiones
                        $scope.aniosLista.forEach(function (l) {
                            if (l.anio == $scope.anio) {
                                l.tipos_eleccion.forEach(function (t) {
                                    if (t.id_tipo_eleccion == $scope.currentDpa.idTipoEleccion) {
                                        $scope.ctiposDpa = t;
                                    }
                                });
                            }
                        });

                    }
                }, function (error) {
                    console.warn("Error en la conexión a GeoElectoral API");
                });
            };
            //$scope.recargarMapa = recargarMapa;

            // Sumar el total de votos por partido cuando se muestran varios dpas
            var sumarValidos = function (dpas, features) {
                var totalPartidos = [];
                var totalVotos = 0;
                var totalVotosP = 0;
                if (dpas)
                    dpas.forEach(function (dpa) {
                        //if(dpa.id_dpa_superior==$scope.currentDpa.idDpa || $scope.currentDpa.idDpa==1)
                        if (features.some(function (feat) {
                            return feat.properties.id_dpa == dpa.id_dpa;
                        }))
                            dpa.partidos.forEach(function (p, i) {
                                if (p.sigla === 'VALIDOS') {
                                    totalVotos += p.resultado;
                                } else {
                                    var c = 0;
                                    totalVotosP += p.resultado;
                                    totalPartidos.forEach(function (totalp, i) {
                                        if (totalp.id_partido === p.id_partido) {
                                            totalPartidos[i].resultado += p.resultado;
                                            return;
                                        }
                                        c++;
                                    });
                                    if (c == totalPartidos.length) {
                                        totalPartidos.push(p);
                                    }
                                }
                            });
                    });
                totalPartidos.forEach(function (totalp, i) {
                    //totalPartidos[i].porcentaje = parseInt(totalp.resultado / totalVotosP * 10000)/100;
                    totalPartidos[i].porcentaje = 0;
                });
                return totalPartidos;
            }

        });
