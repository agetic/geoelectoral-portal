'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:tortaBolivia
 * @description
 * # tortaBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('tortaBolivia', function(GrupoFactory) {
    var link = function(scope, element, attrs) {
      var graficarTorta = function() {
        if (!scope.data) { return; }

        d3.select(element[0]).selectAll('*').remove();

        var width = 460,
            height = 360,
            radius = Math.min(width, height) / 2.3,
            labelr = radius;

        var color = d3.scale.ordinal();

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.porcentaje; });

        var svg = d3.select(element[0]).append('svg')
            //.attr('width', width)
            //.attr('height', height)
            .attr('version','1.1')
            .attr('viewBox','0 0 ' + (width) +' '+ (height) )
          .append('g')
            .attr('transform', 'translate(' + width / 2 + ', ' + height / 2 + ')');

        var partidos = GrupoFactory.agruparPartidos(scope.data);

        color.range(partidos.map(function(d) {
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

        g.append('svg:path')
            .attr('d', arc)
            .attr('class', 'hover')
            .attr('fill', function(d) { return color(d.data.sigla); })
            .on('mouseover', GrupoFactory.tortaMouseover)
            .on('mouseout', GrupoFactory.tortaMouseout);

        g.append('svg:text')
            .attr('transform', function(d) {
              var c = arc.centroid(d),
                  x = c[0],
                  y = c[1],
                  h = Math.sqrt(x*x + y*y); // Teorema de pitágoras para hipotenusa
              return 'translate(' + (x/h * labelr) + ',' +
                (y/h * labelr) + ')';
            })
            .attr('dy', function(d) {
              return (d.endAngle + d.startAngle)/2 > (3*Math.PI/2) ?
                  '-0.35em' : '+0.35em';
            })
            .attr('text-anchor', function(d) {
              return (d.endAngle + d.startAngle)/2 > Math.PI ?
                  'end' : 'start';
            })
            .style('fill', 'black')
            .on('mouseover', GrupoFactory.tortaMouseover)
            .on('mouseout', GrupoFactory.tortaMouseout)
            .each(function(d) {
              d3.select(this)
                .append('tspan')
                .text(d.data.sigla);
              d3.select(this)
                .append('tspan')
                .attr('dy', 15)
                .attr('x', 0)
                .text(d.data.porcentaje + '%');
            });
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
