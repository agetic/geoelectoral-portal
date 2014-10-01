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

    // Mouseover sobre barras o torta
    var mouseover = function(partido) {
      if (partido.partidos) {
        partido.partidos.forEach(function(p) {
          $('#partido_' + p.id_partido).addClass('active');
        });
      } else {
        $('#partido_' + partido.id_partido).addClass('active');
      }
    };


    // Mouseoout sobre barras o torta
    var mouseout = function(partido) {
      if (partido.partidos) {
        partido.partidos.forEach(function(p) {
          $('#partido_' + p.id_partido).removeClass('active');
        });
      } else {
        $('#partido_' + partido.id_partido).removeClass('active');
      }
    };

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
      },

      // Mouseover y Mouseout sobre Barras
      barraMouseover: function(d) {
        mouseover(d);
      },
      barraMouseout: function(d) {
        mouseout(d);
      },

      // Mouseover y Mouseout sobre Torta
      tortaMouseover: function(d) {
        mouseover(d.data);
      },
      tortaMouseout: function(d) {
        mouseout(d.data);
      }

    };
  });
