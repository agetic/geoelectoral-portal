'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:mapaBolivia
 * @description
 * # mapaBolivia
 */
angular.module('geoelectoralFrontendApp')
  .directive('mapaBolivia', function (ENV) {
    // Contenedor del mapa
    var elmapa = '<div id="mapa"></div>';

    d3.select('#fondo-mapa').selectAll('*').remove();
    d3.select('#fondo-mapa').html(elmapa);

    var map = L.map('mapa',{zoomControl:false,
                            attributionControl:false,
                            maxZoom: 14,
                            minZoom: 4,
                            maxBounds: [[-24,-75],[-8,-45]]
                            //maxBounds: [[-54,-169],[83,195]]
                           });
    
    //add zoom control with your options
    L.control.zoom({position:'topleft',zoomInTitle:'Acercar',zoomOutTitle:'Alejar'}).addTo(map);

    //crear el control de circulos
    var controlCirculo = L.control({position: 'topleft'});

    controlCirculo.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'leaflet-bar');
      div.innerHTML = '<a title="Burbujas"><svg width="26" height="26"><g><circle id="ctrl-circulo" stroke="#000" fill="#fff" cx="13" cy="13" r="8"></g></svg></a>'; 
      return div;
    };
    controlCirculo.addTo(map);
    // add the event handler
    function controlCirculoClick() {
      var ctrl = d3.select('#ctrl-circulo');
      if(ctrl.attr('fill')=='#fff') {
        d3.selectAll('.circulo').classed('hidden',false);
        ctrl.attr('fill','#000');
        d3.selectAll('.departamento').classed('burbuja',true);
        //d3.selectAll('.departamento').attr('opacity',0.5);
      } else {
        d3.selectAll('.circulo').classed('hidden',true);
        ctrl.attr('fill','#fff');
        d3.selectAll('.departamento').classed('burbuja',false);
        //d3.selectAll('.departamento').attr('opacity',1);
      }
    }
    d3.select('#ctrl-circulo').on('click',controlCirculoClick);
    //document.getElementById ("ctrl-circulo").addEventListener ("click", controlCirculoClick, false);

    function controlCirculoHide() {
      if(d3.select('#ctrl-circulo').attr('fill')=='#fff')
        return 'hidden';
      else
        return '';
    }
    function departamentoBurbuja() {
      if(d3.select('#ctrl-circulo').attr('fill')=='#fff')
        return '';
      else
        return 'burbuja';
    }
    //fin crear el control de circulos

    var tLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
      id: 'mayakreidieh.map-dfh9esrb'
    }).addTo(map);


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


    function link(scope, element, attr) {

      var mapaCentroide = d3.geo.centroid(scope.data.data).reverse();
      if(!mapaCentroide[0]) { mapaCentroide = [-16.642589, -64.617366]; }
      map.setView(mapaCentroide, 5);

      var graficarMapa = function() {
        if (!scope.data.data) { return; }

        /* Funciones  y variables necesarias */
        var votos = scope.votos;
        var partido = scope.partido;
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

        // Evento click en el mapa
        var mpos = [0,0];
        var touchstart = function(d){
          mpos[0] = d3.event.changedTouches[0].pageX;
          mpos[1] = d3.event.changedTouches[0].pageY;
        };
        var touchend = function(d){
          if(mpos[0]==d3.event.changedTouches[0].pageX && mpos[1]==d3.event.changedTouches[0].pageY ){
            scope.currentDpa.idDpa = d.properties.id_dpa;
            establecerDescendiente(d, scope.currentDpa, scope.tiposDpa);
            scope.currentDpa.dpaNombre = d.properties.nombre;
            scope.$apply();
          }
        };
        var mousedown = function(d){
          mpos = [d3.event.layerX,d3.event.layerY];
        };
        var mouseup = function(d){
          if(mpos[0]==d3.event.layerX && mpos[1]==d3.event.layerY){
            scope.currentDpa.idDpa = d.properties.id_dpa;
            establecerDescendiente(d, scope.currentDpa, scope.tiposDpa);
            scope.currentDpa.dpaNombre = d.properties.nombre;
            scope.$apply();
          }
        };
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
            .style('left', (d3.event.pageX - 0) + 'px')
            .style('top', (d3.event.pageY-0) + 'px');
          if (d.partido.sigla === undefined) {
            toolt = tooltipTplBlank.replace(/{sigla}/g, 'Sin datos')
                             .replace(/{lugar}/g, d.properties.nombre);
          }
          div.html(toolt);
        };
        var mouseout = function() {
          div.transition()
             .duration(500)
             .style('opacity', 1e-6);
        };

        /* Funciones necesarias */
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
          return colorEscala.range(['white', '#' + (d.partido.color || ENV.color)])((d.partido.porcentaje+0.0001) || 100);
        };
        /* Fin funciones necesarias */

        d3.select(map.getPanes().overlayPane).select('svg').remove();
        var svg = d3.select(map.getPanes().overlayPane).append('svg'),
            g = svg.append('g').attr('class', 'leaflet-zoom-hide departamentos');

        var collection=scope.data.data;

        var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

        var feature = g.selectAll('path')
            .data(collection.features)
          .enter().append('path')
            .attr('class', 'departamento hover '+departamentoBurbuja())
            .attr('fill', function(d) { return setColorPartido(d, votos, partido); })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout)
            .on('touchstart',touchstart)
            .on('touchend',touchend)
            .on('mousedown', mousedown)
            .on('mouseup', mouseup);
        // Reposition the SVG to cover the features.
        function reset() {
          var escala=1;
          var bounds = path.bounds(scope.data.data),
              topLeft = bounds[0],
              bottomRight = bounds[1];

          svg .attr('width', (bottomRight[0] - topLeft[0])*escala)
              .attr('height', (bottomRight[1] - topLeft[1])*escala)
              .style('left', topLeft[0] + 'px')
              .style('top', topLeft[1] + 'px');

          g   .attr('transform', 'translate(' + -topLeft[0]*escala + ',' + -topLeft[1]*escala + ')scale('+escala+')');

          feature.attr('d', path);

          g.selectAll('circle').remove();
          circulos();
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
          var point = map.latLngToLayerPoint(new L.LatLng(y, x));
          this.stream.point(point.x, point.y);
        }
        map.on('viewreset', reset);
        reset();
        map.fitBounds( [d3.geo.bounds(collection)[0].reverse(),d3.geo.bounds(collection)[1].reverse()] );

        function circulos() {
          collection.features.forEach(function(p) {
            var punto = path.centroid(p);
            if(punto[0] && p.partido.porcentaje>0 && p.partido.porcentaje<100 && p.properties.extent){
              g.append('circle')
                      .attr('fill','#'+p.partido.color)
                      .attr('stroke','#888')
                      .attr('opacity','.7')
                      .attr('title',p.partido.sigla+'\n'+p.partido.porcentaje+'%\n'+p.properties.nombre)
                      .attr('class','circulo '+controlCirculoHide())
                      .attr('cx', punto[0])
                      .attr('cy', punto[1])
                      .attr('r', ((0.250*Math.pow(2,map.getZoom()))*p.partido.porcentaje/100));
            }
          });
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
