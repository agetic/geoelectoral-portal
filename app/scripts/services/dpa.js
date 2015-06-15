'use strict';

/**
 * @ngdoc service
 * @name geoelectoralFrontendApp.Dpa
 * @description
 * # Dpa
 * Factory in the geoelectoralFrontendApp.
 */
angular.module('geoelectoralFrontendApp')
  .factory('Dpa', function ($http, ENV) {
    // Service logic
    var host = ENV.geoelectoralApi;
    var api = ENV.geoelectoralApiVersion;
    var dpaUrl = host + api + '/dpa';
    var _dpa = [];

    var tiposDpa = [
      { idTipoDpa: 1, nombre: 'país', idTipoDpaSuperior: null },
      { idTipoDpa: 2, nombre: 'departamento', idTipoDpaSuperior: 1 },
      { idTipoDpa: 3, nombre: 'provincia', idTipoDpaSuperior: 2 },
      { idTipoDpa: 4, nombre: 'municipio', idTipoDpaSuperior: 3 },
      { idTipoDpa: 5, nombre: 'circunscripción', idTipoDpaSuperior: 2 },
      { idTipoDpa: 6, nombre: 'recinto', idTipoDpaSuperior: 4 },
      { idTipoDpa: 8, nombre: 'cir_recinto', idTipoDpaSuperior: 5 }
    ];

    // Convertir a la estructura del Current Dpa
    var toCurrentDpa = function (cDpa) {
      var currentDpa = {};
      if (cDpa) {
        currentDpa = {
          'idDpa': cDpa.id_dpa,
          'idTipoDpaActual': cDpa.id_tipo_dpa,
          'idTipoEleccion': cDpa.id_tipo_eleccion || 1,
          'dpaNombre': cDpa.nombre,
          'idTipoDpa': cDpa.id_tipo_dpa
        }
      }
      return currentDpa;
    }

    // Estable el descendiente: departamento => provincia
    var establecerDescendiente = function (currentDpa) {
      var idTipoDpa = null;
      // Seleccionar la primera ocurrencia
      tiposDpa.some(function(t) {
        if (t.idTipoDpaSuperior === currentDpa.idTipoDpaActual) {
          idTipoDpa = t.idTipoDpa;
          return true;
        }
      });
      return idTipoDpa;
      /*if (idTipoDpa !== null) {
        currentDpa.idTipoDpa = idTipoDpa;
      }
      currentDpa.idTipoDpaActual = d.properties.id_tipo_dpa;*/
    };

    var getIdDpaSuperior = function (idDpa, bc) {
      var id_dpa_superior=null;
      _dpa.some(function(d) {
        if (d.id_dpa === idDpa) {
          id_dpa_superior = d.id_dpa_superior;
          bc.push(d.id_dpa);
          return true;
        }
      });
      return id_dpa_superior;
    };

    var buscarIdDpaSuperior = function (idDpa, bc) {
      var id_dpa_superior=null;
      _dpa.some(function(d) {
        if (d.id_dpa === idDpa) {
          id_dpa_superior = d.id_dpa_superior;
          bc.push(d);
          return true;
        }
      });
      return id_dpa_superior;
    };

    var hayDpa4Eleccion = function (anioDetalle,antDpa){
      var i=0;
      var id_tipos_dpa=null;
      while(i<anioDetalle.tipos_eleccion.length){
        if(anioDetalle.tipos_eleccion[i].id_tipo_eleccion==antDpa.idTipoEleccion){
          id_tipos_dpa = anioDetalle.tipos_eleccion[i].id_tipos_dpa;
          break;
        }
        i++;
      }
      if(id_tipos_dpa){
        i=0;
        while(i<id_tipos_dpa.length){
          if(id_tipos_dpa[i]==antDpa.idTipoDpa)
            return true;
          i++;
        }
      }
      return false;
    }

    // Public API here
    return {

      // Datos de todos los dpa
      query: function (fecha) {
        return $http.get(dpaUrl+'?fecha='+fecha).then(function (data) {
          _dpa = data.data;
          return _dpa;
        }, function (error) {
          console.warn("Error al cargar datos de DPAs.");
        });
      },

      // Búsqueda de los datos del DPA
      find: function (idDpa) {
        var d = null;
        _dpa.some(function (e) {
          if (e.id_dpa === idDpa) {
            d = e;
            return true
          }
        });
        return d;
      },

      // Generar Breadcrumb a partir de los descendientes
      breadcrumb: function (idDpa) {
        var id_dpa_superior, bc = [];
        id_dpa_superior = buscarIdDpaSuperior(idDpa, bc);
        while (id_dpa_superior !== null) {
          id_dpa_superior = buscarIdDpaSuperior(id_dpa_superior, bc);
        }
        return bc.reverse();
      },

      // Verificar si es idDpaHijo del idDpa
      verificarSuperior: function (idDpa, idDpaHijo) {
        var sw = false;
        if(idDpa===idDpaHijo) return true; // En vista recintos tambien se muestra el dpa superior.
        this.idDpasPadre(idDpaHijo).some(function (id) {
          if (id === idDpa) {
            sw = true;
            return true;
          }
        });
        return sw;
      },

      // Obtener idDpas padres de un idDpa
      idDpasPadre: function (idDpa) {
        var id_dpa_superior, bc = [];
        id_dpa_superior = getIdDpaSuperior(idDpa, bc);
        while (id_dpa_superior !== null) {
          id_dpa_superior = getIdDpaSuperior(id_dpa_superior, bc);
        }
        return bc.slice(1, bc.length);
      },

      // Obtener el Dpa Superior de un idTipoDpa
      getIdTipoDpaSuperior: function (idTipoDpa) {
        var idTipoDpaSuperior = null;
        tiposDpa.some(function (t) {
          if (t.idTipoDpa === idTipoDpa) {
            idTipoDpaSuperior = t.idTipoDpaSuperior;
            return true;
          }
        });
        return idTipoDpaSuperior;
      },

      // Verificar si es posible
      verificarIdTipoDpaSuperior: function (idTipoDpaActual, idTipoDpa) {
        var idTipoDpaSuperior = this.getIdTipoDpaSuperior(idTipoDpa);
        return idTipoDpaActual <= idTipoDpaSuperior;
      }
    };
  });
