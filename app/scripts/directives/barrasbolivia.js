'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:barrasBolivia
 * @description
 * # barrasBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('barrasBolivia', function(GrupoFactory) {
    var link = function(scope, element, attrs) {
      var graficarBarras = function() {
        if (!scope.data) { return; }

        var partidos = GrupoFactory.agruparPartidos(scope.data);

        var calcularHeight = function (partidos, rangeBand, padding) {
          return partidos.length * (padding + rangeBand);
        };

        var padding = 0.2,
            rangeBand = 45; // 35 -> 27

        d3.select(element[0]).selectAll('*').remove();

        var colorBarra = 'steelblue',
            marginTexto = 5;

        var margin = {top: 20, right: 20, bottom: 20, left: 100},
            width = 360 - margin.left - margin.right,
            height = calcularHeight(partidos, rangeBand, padding);

        var x = d3.scale.linear()
            .range([0, width]);

        var y = d3.scale.ordinal()
            .rangeRoundBands([0, height], padding);

        x.domain([0, 100]);
        y.domain(partidos.map(function(d) { return d.sigla; }));

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .tickSize(height).tickSubdivide(true)
            .tickValues([3, 40, 50])
            .tickFormat(function(d) { return d3.format('.0%')(d/100); });

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left');

        // Barras container
        var svg = d3.select(element[0]).append('svg')
            //.attr('width', width + margin.left + margin.right)
            //.attr('height', height + margin.top + margin.bottom)
            .attr('version','1.1')
            .attr('viewBox','0 0 ' + (width + margin.left + margin.right) +' '+ (height + margin.top + margin.bottom) )
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var esTextoMayor = function(texto, data) {
          var anchoTexto = Math.ceil(texto.getBBox().width) + marginTexto * 2;
          var anchoBarra = Math.ceil(x(data.porcentaje));
          return anchoTexto < anchoBarra;
        };

        var setFillColor = function(texto, data) {
          return esTextoMayor(texto, data) ? 'white' : colorBarra;
        };

        svg.append('g')
            .attr('class', 'x axis')
            .call(xAxis);

        var barras = svg.append('g').attr('class', 'barras');
        var etiquetas = svg.append('g').attr('class', 'barras-etiquetas');

        etiquetas.selectAll('text')
            .data(partidos)
          .enter().append('text')
            .attr('class', 'etiqueta')
            .text(function(d) { return d.porcentaje + '%'; })
            .attr('y', function(d) { return y(d.sigla) + y.rangeBand()/2; })
            .attr('x', function(d) { return x(d.porcentaje); })
            .attr('text-anchor', 'start')
            .attr('dy', '.35em')
            .attr('dx', function(d) {
              if (esTextoMayor(this, d)) {
                return -Math.ceil(this.getBBox().width) - marginTexto;
              } else {
                return marginTexto;
              }
            })
            .on('mouseover', GrupoFactory.barraMouseover)
            .on('mouseout', GrupoFactory.barraMouseout);

        barras.selectAll('.bar')
            .data(partidos)
          .enter().append('rect')
            .attr('class', 'bar hover')
            .attr('width', function(d) { return x(d.porcentaje); })
            .attr('y', function(d) { return y(d.sigla); })
            .attr('height', y.rangeBand())
            .style('fill', function(d) { return "#"+d.color; })
            .on('mouseover', GrupoFactory.barraMouseover)
            .on('mouseout', GrupoFactory.barraMouseout);


        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);
      };

      scope.$watch('data', graficarBarras);
      scope.$watch('tab', graficarBarras);
    };
    return {
      restrict: 'E',
      link: link,
      scope: { data: '=', tab: '@' }
    };
  });
