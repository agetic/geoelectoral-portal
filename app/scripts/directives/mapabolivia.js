'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:mapaBolivia
 * @description
 * # mapaBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('mapaBolivia', function (ENV) {
    function link(scope, element, attr) {
      var graficarMapa = function() {
        if (!scope.data.data) { return; }

        d3.select(element[0]).selectAll('*').remove();
        // Margins
        var margin = {top: 40, right: 0, bottom: 0, left: 0},
          width = 630 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

        // Mapa
        var mapaCentroide = d3.geo.centroid(scope.data.data); //[2250, -550];
        var escala = 1;
        var offset = [width/2 - margin.left - margin.right - 50,
                      height/2 - margin.top - margin.bottom];
        var projection = d3.geo.mercator()
                           .translate(offset)
                           .scale(escala)
                           .center(mapaCentroide);

        // Define path generator
        var path = d3.geo.path()
                     .projection(projection);

        var bounds = path.bounds(scope.data.data);
        var hEscala = escala*width / (bounds[1][0] - bounds[0][0]);
        var vEscala = escala*height / (bounds[1][1] - bounds[0][1]);
        escala = (hEscala < vEscala) ? hEscala : vEscala;
        offset = [width - (bounds[0][0] + bounds[1][0])/2,
                  height - (bounds[0][1] + bounds[1][1])/2];

        // Nueva proyección
        projection = d3.geo.mercator()
                       .center(mapaCentroide)
                       .scale(escala)
                       .translate(offset);

        path = path.projection(projection);

        // Tooltip container
        var div = d3.select('#tooltip-mapa')
            .attr('class', 'tooltip-mapa')
            .style('opacity', 1e-6);

        var tooltipTpl = [
            '<strong>{sigla}</strong>',
            '<div>Porcentaje: {porcentaje}%</div>',
            '<div>Votos: {votos}</div>',
            '<div>{lugar}</div>',
          ].join('');

        var tooltipTplBlank = [
            '<strong>{sigla}</strong>',
            '<div>{lugar}</div>',
          ].join('');

        var svg = d3.select(element[0]).append('svg')
            //.attr('width', width + margin.left + margin.right)
            //.attr('height', height + margin.top + margin.bottom);
            .attr('version','1.1')
            .attr('viewBox','0 0 ' + (width + margin.left + margin.right) +' '+ (height + margin.top + margin.bottom) );

        // Estable el descendiente: departamento => provincia
        var establecerDescendiente = function(d, currentDpa, tiposDpa) {
          var idTipoDpa = null;
          // Seleccionar la primera ocurrencia
          tiposDpa.some(function(t) {
            if (t.idTipoDpaSuperior === d.properties.id_tipo_dpa) {
              idTipoDpa = t.idTipoDpa;
              return true;
            }
          });
          if (idTipoDpa !== null) {
            currentDpa.idTipoDpa = idTipoDpa;
          }
          currentDpa.idTipoDpaActual = d.properties.id_tipo_dpa;
        };

        // Evento click departamento
        var click = function(d) {
          scope.currentDpa.idDpa = d.properties.id_dpa;
          establecerDescendiente(d, scope.currentDpa, scope.tiposDpa);
          scope.currentDpa.dpaNombre = d.properties.nombre;
          scope.$apply();
        };

        // tooltip functions
        var mouseover = function() {
          div.transition()
             .duration(500)
             .style('opacity', 1);
        };
        var mousemove = function(d) {
          var toolt = tooltipTpl.replace(/{sigla}/g, d.partido.sigla)
                             .replace(/{porcentaje}/g, d.partido.porcentaje)
                             .replace(/{votos}/g, d3.format(',d')(d.partido.resultado))
                             .replace(/{lugar}/g, d.properties.nombre);
          div
            .style('left', (d3.event.pageX + 5) + 'px')
            .style('top', d3.event.pageY + 'px');
          if (d.partido.sigla === undefined) {
            toolt = tooltipTplBlank.replace(/{sigla}/g, 'Sin datos')
                             .replace(/{lugar}/g, d.properties.nombre);
          };
          div.html(toolt);
        };
        var mouseout = function() {
          div.transition()
             .duration(500)
             .style('opacity', 1e-6);
        };

        var maximoPorcentaje = function(d, votos, partido, currentDpa) {
          var max = { porcentaje: 0 };
          if (d.partido.sigla === undefined) {
            max = d.partido;
            d.partido.porcentaje = 100; // 100% para el color gris
          } else {
            votos.forEach(function(v) {
              v.partidos.forEach(function(p) {
                if (partido.id_partido === p.id_partido && max.porcentaje < p.porcentaje) {
                  max = p;
                }
              });
            });
            if (max.porcentaje === 0) {
              max = d.partido;
            }
          }
          return max.porcentaje;
        };

        var partidoSeleccionado = function(d, votos, partido) {
          var max = { porcentaje: 0 };
          votos.forEach(function(v) {
            if(d.properties.codigo === v.dpa_codigo) {
              v.partidos.forEach(function(p) {
                if (partido.id_partido === p.id_partido) {
                  max = p;
                }
              });
            }
          });
          return max;
        };

        var partidoGanador = function(d, votos) {
          var max = { porcentaje: 0 };
          votos.forEach(function(v) {
            if(d.properties.codigo === v.dpa_codigo) {
              v.partidos.forEach(function(p) {
                if (max.porcentaje < p.porcentaje) {
                  max = p;
                }
              });
            }
          });
          return max;
        };

        var setColorPartido = function(d, votos, partido) {
          var colorEscala, color;
          if (partido) {
            d.partido = partidoSeleccionado(d, votos, partido);
            colorEscala = d3.scale.linear().domain([0, maximoPorcentaje(d, votos, partido, scope.currentDpa)]);
          } else {
            d.partido = partidoGanador(d, votos);
            colorEscala = d3.scale.linear().domain([0, 100]);
          }
          return colorEscala.range(['white', '#' + (d.partido.color || ENV.color)])(d.partido.porcentaje || 100);
        };

        var geojson = scope.data.data,
          votos = scope.votos,
          partido = scope.partido;

        svg.call(d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoom));
        svg.append('g')
            .attr('class', 'departamentos')
            .attr('transform', 'translate(' + mapaCentroide + ')')
          .selectAll('path')
            .data(geojson.features)
          .enter().append('path')
            .attr('class', 'departamento hover')
            .attr('fill', function(d) { return setColorPartido(d, votos, partido); })
            .attr('d', path)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout)
            .on('click', click)
            .each(function(d) { d.centroid = path.centroid(d); });
        /*svg.append('g')
            .attr('class', 'departamentos')
            .attr('transform', 'translate(' + mapaCentroide + ')scale(1)')
            .append('path')
              .attr('class', 'departamento')
              .attr('fill','#000000')
              .attr('d','M100,50l10,0l0,-10l5,0l0,10l10,0l0,5l-10,0l0,10l-5,0l0,-10l-10,0l0,-5')
              .on('click',function(d){
                console.log("zoom +");
              });*/
        function zoom() {
          d3.event.translate[0]+=mapaCentroide[0];
          d3.event.translate[1]+=mapaCentroide[1];
          svg.select('g').attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

      };

      scope.$watch('data', graficarMapa);
      scope.$watch('partido', graficarMapa);
    }
    return {
      restrict: 'E',
      link: link,
      scope: {
        data: '=',
        votos: '=',
        currentDpa: '=',
        tiposDpa: '=',
        partido: '='
      }
    };
  });
