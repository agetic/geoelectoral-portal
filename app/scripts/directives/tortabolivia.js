'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:tortaBolivia
 * @description
 * # tortaBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('tortaBolivia', function () {
    var link = function(scope, element, attrs) {
      var graficarTorta = function() {
        if (!scope.data) { return; }

        d3.select(element[0]).selectAll('*').remove();

        var width = 630,
            height = 450,
            radius = Math.min(width, height) / 2.2,
            labelr = radius,
            porcentajeMin = 10;

        var color = d3.scale.ordinal();

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.porcentaje; });

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
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', 'translate(' + width / 2 + ', ' + height / 2 + ')');

        // Agrupar partidos cuyo porcentaje sea menor al 10%
        var agruparPartidos = function(data_partidos) {
          var partidos = [];
          var otros = { 'sigla': 'Otros', 'resultado': 0, 'porcentaje': 0,
                        'color': 'bbb', 'partidos': [] };

          data_partidos.forEach(function(p) {
            if (p.porcentaje < porcentajeMin) {
              otros.resultado += p.resultado;
              otros.porcentaje += p.porcentaje;
              otros.partidos.push(p);
            } else {
              partidos.push(p);
            }
          });
          if (otros.partidos.length > 0) {
            otros.partidos = otros.partidos.sort(function(a, b) { return b.porcentaje - a.porcentaje; });
            otros.porcentaje = d3.round(otros.porcentaje, 2);
            partidos.push(otros);
          }
          return partidos;
        };

        // tooltip functions
        var mouseover = function() {
          div.transition()
             .duration(500)
             .style('opacity', 1);
        };

        var mousemove = function(d) {
          var html = '';
          if (d.data.partidos) {
            html = d.data.partidos.map(function(p) {
              return tooltipTpl.replace(/{sigla}/g, p.sigla)
                               .replace(/{porcentaje}/g, p.porcentaje)
                               .replace(/{votos}/g, d3.format(',d')(p.resultado));
            }).join('<hr />');
          } else {
            html = tooltipTpl.replace(/{sigla}/g, d.data.sigla)
                             .replace(/{porcentaje}/g, d.data.porcentaje)
                             .replace(/{votos}/g, d3.format(',d')(d.data.resultado));
          }

          div
            .style('left', (d3.event.pageX + 5) + 'px')
            .style('top', d3.event.pageY + 'px');

          div.html(html);
        };

        var mouseout = function() {
          div.transition()
             .duration(500)
             .style('opacity', 1e-6);
        };

        var partidos = agruparPartidos(scope.data);

        color.range(partidos.sort(function(a, b) { return a.porcentaje - b.porcentaje; }).map(function(d) {
          var color = '#bbb';
          if (d.color) {
            color = '#' + d.color;
          }
          return color;
        }));

        var g = svg.selectAll('.arc')
            .data(pie(partidos))
          .enter().append('g')
            .attr('class', 'arc');

        g.append('path')
            .attr('d', arc)
            .attr('class', 'hover')
            .attr('fill', function(d) { return color(d.data.sigla); })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        g.append('text')
            .attr('transform', function(d) {
              var c = arc.centroid(d);
              return 'translate(' + c[0]*1.3 + ', ' + c[1]*1.3 + ')';
            })
            .attr('dy', '.35em')
            .style('text-anchor', 'middle')
            .text(function(d) { return d.data.porcentaje + '%'; })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        g.append('text')
            .attr('transform', function(d) {
              var c = arc.centroid(d),
                  x = c[0],
                  y = c[1],
                  h = Math.sqrt(x*x + y*y); // Teorema de pitágoras para hipotenusa
              return 'translate(' + (x/h * labelr) + ',' +
                (y/h * labelr) + ')';
            })
            .attr('dy', '.35em')
            .attr('text-anchor', function(d) {
              return (d.endAngle + d.startAngle)/2 > Math.PI ?
                  'end' : 'start';
            })
            .style('fill', 'black')
            .text(function(d) { return d.data.sigla; })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);
      };

      scope.$watch('data', graficarTorta);
      scope.$watch('tab', graficarTorta);
    };
    return {
      restrict: 'E',
      link: link,
      scope: { data: '=', tab: '@' }
    };
  });
