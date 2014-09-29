'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:mapaBolivia
 * @description
 * # mapaBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('mapaBolivia', function () {
    function link(scope, element, attr) {
      var graficarMapa = function() {
        if (!scope.data.data) { return; }

        d3.select(element[0]).selectAll('*').remove();
        // Margins
        var margin = {top: 20, right: 10, bottom: 50, left: 55},
          width = 630 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

        // Mapa
        var mapaCentroide = d3.geo.centroid(scope.data.data); //[2250, -550];
        var escala = 1;
        var offset = [width/2 - margin.left - margin.right,
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
        var div = d3.select('#tooltip')
            .attr('class', 'tooltip')
            .style('opacity', 1e-6);

        var tooltipTpl = [
            '<strong>{sigla}</strong>',
            '<div>Porcentaje: {porcentaje}%</div>',
            '<div>Votos: {votos}</div>',
          ].join('');

        var svg = d3.select(element[0]).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

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
          div
            .style('left', (d3.event.pageX + 5) + 'px')
            .style('top', d3.event.pageY + 'px');
          div.html(tooltipTpl.replace(/{sigla}/g, d.partido.sigla)
                             .replace(/{porcentaje}/g, d.partido.porcentaje)
                             .replace(/{votos}/g, d3.format(',d')(d.partido.resultado)));
        };
        var mouseout = function() {
          div.transition()
             .duration(500)
             .style('opacity', 1e-6);
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

        var setColorPartido = function(d, votos) {
          var colorEscala;
          d.partido = partidoGanador(d, votos);
          colorEscala = d3.scale.linear().domain([0, 100]);
          return colorEscala.range(['white', '#' + d.partido.color])(d.partido.porcentaje);
        };

        var geojson = scope.data.data,
          votos = scope.votos;

        svg.append('g')
            .attr('class', 'departamentos')
            .attr('transform', 'translate(' + mapaCentroide + ')')
          .selectAll('path')
            .data(geojson.features)
          .enter().append('path')
            .attr('class', 'departamento hover')
            .attr('fill', function(d) { return setColorPartido(d, votos); })
            .attr('d', path)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout)
            .on('click', click)
            .each(function(d) { d.centroid = path.centroid(d); });

        var fondoLayer = svg.append('g')
            .attr('class', 'fondos')
            .attr('transform', 'translate(' + mapaCentroide + ')');

        var textoLayer = svg.append('g')
            .attr('class', 'etiquetas')
            .attr('transform', 'translate(' + mapaCentroide + ')');

        textoLayer.selectAll('text')
            .data(geojson.features)
          .enter().append('text')
            .attr('transform', function(d) { return 'translate(' + d.centroid + ')'; })
            .attr('dy', '.35em')
            .text(function(d) { return d.partido.sigla; })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout)
            .each(function(d) {
              d.texto_height = this.getBBox().height + 2;
              d.texto_width = this.getBBox().width + 4;
            });

        fondoLayer.selectAll('rect')
            .data(geojson.features)
          .enter().append('rect')
            .attr('height', function(d) { return d.texto_height; })
            .attr('width', function(d) { return d.texto_width; })
            .attr('rx', '3')
            .attr('transform', function(d) {
              return 'translate(' + (d.centroid[0] - d.texto_width/2) + ', ' +
                (d.centroid[1] - d.texto_height/2) + ')';
            })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

      };

      scope.$watch('data', graficarMapa);
    }
    return {
      restrict: 'E',
      link: link,
      scope: { data: '=', votos: '=', currentDpa: '=', tiposDpa: '=' }
    };
  });
