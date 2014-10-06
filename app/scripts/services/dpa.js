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
      { idTipoDpa: 5, nombre: 'circunscripción', idTipoDpaSuperior: 2 }
    ];

    // Convertir a la estructura del Current Dpa
    var toCurrentDpa = function (cDpa) {
      var currentDpa = {};
      if (cDpa) {
        currentDpa = {
          'idDpa': cDpa.id_dpa,
          'idTipoDpaActual': cDpa.id_tipo_dpa,
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

    // Public API here
    return {

      // Datos de todos los dpa
      query: function () {
        return $http.get(dpaUrl).then(function (data) {
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
        d = toCurrentDpa(d);
        if (establecerDescendiente(d) !== null) {
          d.idTipoDpa = establecerDescendiente(d);
        }
        return d;
      }

    };
  });
