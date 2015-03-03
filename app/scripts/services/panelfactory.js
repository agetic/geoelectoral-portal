'use strict';

/**
 * @ngdoc service
 * @name geoelectoralFrontendApp.PanelFactory
 * @description
 * # PanelFactory
 * Factory in the geoelectoralFrontendApp.
 */
angular.module('geoelectoralFrontendApp')
  .factory('PanelFactory', function (ENV) {

    function radioFromCant(cantidad,zoom) {
      var bc = d3.select('#mapa-breadcrumb').selectAll('li');
      var zoomDpa = 0;
      if(bc[0]) {
        zoomDpa = bc[0].length-1;
      }
      if(zoom>6)
        if(zoomDpa>2)
          zoom = 4+zoomDpa;
        else
          zoom = 6;
      return (0.8*(Math.pow(2,zoom))* Math.sqrt(cantidad)/1000 );
    }
    function cantFromRadio(radio,zoom) {
      var bc = d3.select('#mapa-breadcrumb').selectAll('li');
      var zoomDpa = 0;
      if(bc[0]) {
        zoomDpa = bc[0].length-1;
      }
      if(zoom>6)
        if(zoomDpa>2)
          zoom = 4+zoomDpa;
        else
          zoom = 6;
      return parseInt(Math.pow((parseFloat(radio)/0.8/(Math.pow(2,zoom))*1000),2));
    }

    // Public API here
    return {
      // Tamaño del radio a partir de la cantidad
      radioFromCant: function(cantidad,zoom) {
        return radioFromCant(cantidad,zoom);
      },
      // Obtiene la cantidad a partir del radio.
      cantFromRadio: function(radio,zoom) {
        return cantFromRadio(radio,zoom);
      },
      // Crea la leyenda para las burbujas.
      makeLegend: function() {
        d3.select('#bubble-legend').selectAll('svg').remove();
          var l1 = d3.select('#bubble-legend');
          var lg = l1.append('svg').append('g');
            lg.selectAll('circle').remove();
            lg.append('circle')
              .attr('fill','#'+ENV.color)
              .attr('stroke','#000')
              .attr('cx',64)
              .attr('cy',128-radioFromCant(1000000,6))
              .attr('r',radioFromCant(1000000,6));
            lg.append('circle')
              .attr('fill','#'+ENV.color)
              .attr('stroke','#000')
              .attr('cx',64)
              .attr('cy',128-radioFromCant(600000,6))
              .attr('r',radioFromCant(600000,6));
            lg.append('circle')
              .attr('fill','#'+ENV.color)
              .attr('stroke','#000')
              .attr('cx',64)
              .attr('cy',128-radioFromCant(300000,6))
              .attr('r',radioFromCant(300000,6));
            lg.append('circle')
              .attr('fill','#'+ENV.color)
              .attr('stroke','#000')
              .attr('cx',64)
              .attr('cy',128-radioFromCant(100000,6))
              .attr('r',radioFromCant(100000,6));
            lg.append('text')
              .attr('id','ltext0')
              .text(1000000)
              .attr('x',43)
              .attr('y',126-radioFromCant(1000000,6)*2)
            lg.append('text')
              .attr('id','ltext1')
              .text(600000)
              .attr('x',43)
              .attr('y',126-radioFromCant(600000,6)*2)
            lg.append('text')
              .attr('id','ltext2')
              .text(300000)
              .attr('x',43)
              .attr('y',126-radioFromCant(300000,6)*2)
            lg.append('text')
              .attr('id','ltext3')
              .text(100000)
              .attr('x',43)
              .attr('y',126-radioFromCant(100000,6)*2)
      },
      // Cambia el tamaño o los valores de la leyenda para burbujas
      changeLegend: function(zoom) {
        var lcircle = d3.select('#bubble-legend').selectAll('circle');
        var ltext;
        if(zoom>=6) {
          d3.select('#bubble-legend').select('svg').attr('transform','translate(0,0)');
          $('#bubble-legend').css('width',128);
          $('#bubble-legend').css('height',128);
          lcircle[0].forEach(function(c,i){
            c=d3.select(c);
            ltext = $('#ltext'+i);
            ltext.text(parseInt(cantFromRadio(c.attr('r'),zoom)/100)*100);
            ltext.attr('x',64-ltext[0].getBBox().width/2);
          });
        }else{
          d3.select('#bubble-legend').select('svg').attr('transform','translate(0,0)scale('+(1/Math.pow(2,6-zoom))+')');
          $('#bubble-legend').css('width',128/Math.pow(2,6-zoom));
          $('#bubble-legend').css('height',128/Math.pow(2,6-zoom));
        }
      }

    };
  });
