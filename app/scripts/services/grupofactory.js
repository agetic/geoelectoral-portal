'use strict';

/**
 * @ngdoc service
 * @name geoelectoralFrontendApp.GrupoFactory
 * @description
 * # GrupoFactory
 * Factory in the geoelectoralFrontendApp.
 */
angular.module('geoelectoralFrontendApp')
  .factory('GrupoFactory', function (ENV) {
    // Service logic
    // ...

    var meaningOfLife = 42;

    // Public API here
    return {
      // Agrupar partidos con porcentaje menor 3%
      agruparPartidos: function (dataPartidos) {
        var partidos = [],
            orden = 0,
            porcentajeMin = ENV.porcentajeMin,
            otros = { 'sigla': 'Otros', 'resultado': 0, 'porcentaje': 0,
                      'color': 'bbb', 'partidos': [] };

        dataPartidos.forEach(function(p) {
          if (p.porcentaje < porcentajeMin) {
            otros.resultado += p.resultado;
            otros.porcentaje += p.porcentaje;
            otros.partidos.push(p);
          } else {
            p.orden = orden++;
            partidos.push(p);
          }
        });

        if (otros.partidos.length > 0) {
          otros.partidos = otros.partidos.sort(function(a, b) { return b.porcentaje - a.porcentaje; });
          otros.porcentaje = d3.round(otros.porcentaje, 2);
          otros.orden = orden;
          partidos.push(otros);
        }
        return partidos;
      }
    };
  });
