'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:barrasBolivia
 * @description
 * # barrasBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('barrasBolivia', function () {
    var link = function(scope, element, attrs) {
      var colorBarra = 'steelblue';
      var marginTexto = 5;

      var margin = {top: 20, right: 20, bottom: 20, left: 90},
          width = 630 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var x = d3.scale.linear()
          .range([0, width]);

      var y = d3.scale.ordinal()
          .rangeRoundBands([height, 0], 0.2);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left");

      // Tooltip container
      var div = d3.select('#tooltip')
          .attr('class', 'tooltip')
          .style('opacity', 1e-6);

      var tooltipTpl = [
          "<strong>{sigla}</strong>",
          "<div>Porcentaje: {porcentaje}%</div>",
          "<div>Votos: {votos}</div>",
        ].join('');

      // Barras container
      var svg = d3.select(element[0]).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var esTextoMayor = function(texto, data) {
        var anchoTexto = Math.ceil(texto.getBBox().width) + marginTexto * 2;
        var anchoBarra = Math.ceil(x(data.porcentaje));
        return anchoTexto < anchoBarra;
      };

      var setFillColor = function(texto, data) {
        return esTextoMayor(texto, data) ? 'white' : colorBarra;
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
        div.html(tooltipTpl.replace(/{sigla}/g, d.sigla)
                           .replace(/{porcentaje}/g, d.porcentaje)
                           .replace(/{votos}/g, d3.format(',d')(d.resultado)));
      };
      var mouseout = function() {
        div.transition()
           .duration(500)
           .style('opacity', 1e-6);
      };

      var graficarBarras = function() {
        if (!scope.data) { return };

        var partidos = scope.data;

        x.domain([0, 100]);
        y.domain(partidos.map(function(d) { return d.sigla; }));

        svg.selectAll(".bar")
            .data(partidos)
          .enter().append("rect")
            .attr("class", "bar hover")
            .attr("width", function(d) { return x(d.porcentaje); })
            .attr("y", function(d) { return y(d.sigla); })
            .attr("height", y.rangeBand())
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        svg.selectAll("text")
            .data(partidos)
          .enter().append('text')
            .attr('class', 'etiqueta')
            .text(function(d) { return d.porcentaje + '%'; })
            .attr('y', function(d) { return y(d.sigla) + y.rangeBand()/2; })
            .attr('x', function(d) { return x(d.porcentaje); })
            .style('fill', function(d) { return setFillColor(this, d); })
            .attr('text-anchor', 'start')
            .attr('dy', '.35em')
            .attr('dx', function(d) {
              if (esTextoMayor(this, d)) {
                return -Math.ceil(this.getBBox().width) - marginTexto;
              } else {
                return marginTexto;
              }
            })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
      };

      scope.$watch('data', graficarBarras);
    };
    return {
      restrict: 'E',
      link: link,
      scope: { data: '=' }
    };
  });
