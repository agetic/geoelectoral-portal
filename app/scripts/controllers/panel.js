'use strict';

/**
 * @ngdoc function
 * @name geoelectoralFrontendApp.controller:PanelCtrl
 * @description
 * # PanelCtrl
 * Controller of the geoelectoralFrontendApp
 */
angular.module('geoelectoralFrontendApp')
  .controller('PanelCtrl', function (ENV, $scope, $window, leafletData, PanelFactory) {

    $scope.tab = 1;

    $scope.selectTab = function(setTab) {
      $scope.tab = setTab;
    };

    $scope.isSelected = function(checkTab) {
      return $scope.tab === checkTab;
    };

    var w = angular.element($window);
    $scope.getWindowDimensions = function () {
        //$('.dropdown-submenu > a').submenupicker();
        return {'h': w.height(),'w': w.width()};
    };

    // Extiende la directiva angular-leaflet
    angular.extend($scope, {
      bolivia: {
        lat: -16.642589,
        lng: -64.617366,
        zoom: 5
      },
      maxbounds: {
                  southWest: {
                      lat: 90,
                      lng: 340
                  },
                  northEast: {
                      lat: -90,
                      lng: -230
                  }
      },
      defaults: {
        zoomControl: false,
        scrollWheelZoom: true,
        maxZoom: 17,
        minZoom: 2,
        attributionControl: false,
        tileLayer: ''
        //maxBounds: [[-90,-230],[90,340]],
        //maxBounds: [[-54,-169],[83,195]],
        /*
        tileLayer: 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',
        tileLayerOptions: {
          id: 'mayakreidieh.map-dfh9esrb',
        }
        */
      }
    });


    // Para control del mapa
    var map;
    var svg,g;
    var reset = function(){};
    var circulos = function(){};


    leafletData.getMap('mapa').then(function(objmap) {
      map = objmap;

      /* Fondos de mapa */
      var maya = new L.TileLayer('https://{s}.tiles.mapbox.com/v3/mayakreidieh.map-dfh9esrb/{z}/{x}/{y}.png',{
          attribution: 'mayakreidieh.map-dfh9esrb'
      });

      var topo = new L.TileLayer('http://server.opentopomap.org/{z}/{x}/{y}.png',{
          detectRetina: true,
          minZoom: 1, maxZoom: 16,
          attribution: 'Kartendaten: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, <a href="http://viewfinderpanoramas.org">SRTM</a> | Kartendarstellung: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      });

      var osm = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
          maxZoom: 19,
          detectRetina: true,
          attribution: 'Kartendaten &copy; OpenStreetMap'
      });

      var geobo1 = L.tileLayer.wms("http://geo.gob.bo/raster/service/wms?SERVICE=WMS&", {
          layers: 'mapbox_terrain',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          attribution: "GeoBolivia"
      });

      var geobo2 = L.tileLayer.wms("http://geo.gob.bo/raster/service/wms?SERVICE=WMS&", {
          layers: 'mapbox_bolivia',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          attribution: "GeoBolivia"
      });

      var geobo3 = L.tileLayer.wms("http://geo.gob.bo/geoserver/fondos/ows?SERVICE=WMS&", {
          layers: 'openstreetmap',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          attribution: "GeoBolivia"
      });

      var grayscale = new L.TileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ',{
          id: 'mapbox.light',
          attribution:  'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                        'Imagery © <a href="http://mapbox.com">Mapbox</a>'
      });
      var streets = new L.TileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ',{
          id: 'mapbox.streets',
          attribution:  'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                        'Imagery © <a href="http://mapbox.com">Mapbox</a>'
      });

      var baseMaps = {
        'Por defecto': maya,
        'GeoBolivia Terrain': geobo1,
        'GeoBolivia Satelite': geobo2,
        'GeoBolivia OpenStreetMap': geobo3,
        'OpenTopoMap': topo,
        'OpenStreetMap': osm,
        'GrayScale': grayscale,
        'Streets': streets
      }
      // Fondo por defecto
      maya.addTo(map);

      //adicionar zoom control
      L.control.zoom({position:'topleft',zoomInTitle:'Acercar',zoomOutTitle:'Alejar'}).addTo(map);

      //crear el control de circulos
      var controlCirculo = L.control({position: 'topleft'});

      controlCirculo.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'leaflet-bar');
        div.innerHTML = '<a id="ctrl-burbuja" title="Burbujas"><svg width="26" height="26"><g><circle id="ctrl-circulo" stroke="#000" fill="#fff" cx="13" cy="13" r="8"></g></svg></a>';
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
          d3.select('.leaflet-bottom.leaflet-right').classed('hidden',false);
          circulos();
          //d3.selectAll('.departamento').attr('opacity',0.5);
        } else {
          d3.selectAll('.circulo').classed('hidden',true);
          ctrl.attr('fill','#fff');
          d3.selectAll('.departamento').classed('burbuja',false);
          d3.select('.leaflet-bottom.leaflet-right').classed('hidden',true);
          //d3.selectAll('.departamento').attr('opacity',1);
        }
      }
      d3.select('#ctrl-burbuja').on('click',controlCirculoClick);
      d3.select('#ctrl-burbuja').on('dblclick',function(){
        L.DomEvent.stopPropagation(d3.event); // stop the zoom
      });
      //document.getElementById ("ctrl-circulo").addEventListener ("click", controlCirculoClick, false);

      var controlCentrar = L.control({position: 'topleft'});
      controlCentrar.onAdd = function (map) {
        var div = L.DomUtil.create('div','leaflet-bar');
        div.innerHTML = '<a id="ctrl-centrar" title="Ajustar Mapa"><img width="24" height="24"></a>';
        return div;
      }
      controlCentrar.addTo(map);

      // Leyenda para las burbujas
      var burbujaLeyenda = L.control({position: 'bottomright'});
      burbujaLeyenda.onAdd = function (map) {
        var div = L.DomUtil.create('div','leaflet-bar');
        div.innerHTML = '<a id="bubble-legend"></a>';
        return div;
      }
      burbujaLeyenda.addTo(map);
      d3.select('.leaflet-bottom.leaflet-right').classed('hidden',true);

      PanelFactory.makeLegend();

      var tituloMapa = L.control({position:'bottomleft'});
      tituloMapa.onAdd = function(map) {
        var div = L.DomUtil.create('div','leaflet-bar');
        div.id = 'header-titulo';
        div.innerHTML = $('#header').html();
        $('#header').css('z-index','-1');
        return div;
      }
      tituloMapa.addTo(map);

      //var layersControl = new L.Control.Layers(baseMaps, overlayMaps);
      var layersControl = new L.Control.Layers(baseMaps, null, {position: 'topleft'});
      map.addControl(layersControl);

    });

    // Llevarlo como factory
    function isBurbujaEnabled(){
      return (d3.select('#ctrl-circulo').attr('fill')=='#000');
    }
    function controlCirculoHide() {
      return isBurbujaEnabled()?'':'hidden';
    }
    function departamentoBurbuja(d) {
      if(d.properties.id_tipo_dpa!=$scope.currentDpa.idTipoDpa)
        return isBurbujaEnabled()?'burbuja fondo':'fondo';
      if(d.properties.id_tipo_dpa!=$scope.currentDpa.idTipoDpa || d.properties.id_tipo_dpa!=6)
        return isBurbujaEnabled()?'burbuja':'';
      return isBurbujaEnabled()?'burbuja recinto':'recinto';
    }
    //fin crear el control de circulos

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

    var controlCentrarClick = function(){}

    var mapaCentroide = [];
    if(!mapaCentroide[0]) { mapaCentroide = [-16.642589, -64.617366]; }

    $scope.centrarMapa = function(){
      var bounds = d3.geo.bounds($scope.data.data);
      map.fitBounds( [bounds[0].reverse(),bounds[1].reverse()] );
      //map.setView(mapaCentroide, map.getZoom());
    }

    var graficarMapa = function() {
      $scope.data=$scope.dpaGeoJSON;
      if (!$scope.data.data) { return; }
      mapaCentroide = d3.geo.centroid($scope.data.data).reverse();

      controlCentrarClick = function(){
        var bounds = d3.geo.bounds($scope.data.data);
        map.fitBounds( [bounds[0].reverse(),bounds[1].reverse()] );
        //map.setView(mapaCentroide, map.getZoom());
      }
      d3.select('#ctrl-centrar').on('click',controlCentrarClick);
      d3.select('#ctrl-centrar').on('dblclick',function(){
        L.DomEvent.stopPropagation(d3.event); // stop the zoom
      });

      // Copiar titulo
      $('#header-titulo').html($('#header').html());

      /* Funciones  y variables necesarias */
      var votos = $scope.partidosDepartamento;
      var partido = $scope.partidoSeleccionado;
      // Tooltip container
      var div = d3.select('#tooltip-mapa')
          .attr('class', 'tooltip-mapa')
          .style('display','block')
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
      var isTouch=false;

      d3.select('body').on('click',function(){
        if(isTouch &&(d3.event.pageX!=mpos[0] || d3.event.pageY!=mpos[1]) ){
          div.transition()
            .duration(500)
            .style('opacity', 1e-6);
          isTouch=false;
        }
      });
      var countTouch = function(t,d){
        isTouch=true;
        mpos[0] = d3.event.changedTouches[0].pageX;
        mpos[1] = d3.event.changedTouches[0].pageY;
        var e = d3.event;
        var t2 = e.timeStamp,
            t1 = $(t).data('lastTouch') || t2,
            dt = t2 - t1,
            fingers = e.touches.length;
        $(t).data('lastTouch', t2);
        if (!dt || dt > 500 || fingers > 1){ // not double-touch
          div.style('z-index',4)
            .style('opacity', 1)
            .style('left', (e.touches[0].pageX - 0) + 'px')
            .style('top', (e.touches[0].pageY-parseInt(div.style('height'))) + 'px');
          if( e.touches[0].pageX > parseInt(d3.select('#mapa').style('width'))-parseInt(div.style('width')) ){
            div.style('left', (e.touches[0].pageX - parseInt(div.style('width'))) + 'px')
          }

          var toolt = tooltipTpl.replace(/{sigla}/g, d.partido.sigla)
                           .replace(/{porcentaje}/g, d.partido.porcentaje)
                           .replace(/{votos}/g, d3.format(',d')(d.partido.resultado))
                           .replace(/{lugar}/g, d.properties.nombre);
          if (d.partido.sigla === undefined) {
            toolt = tooltipTplBlank.replace(/{sigla}/g, 'Sin datos')
                             .replace(/{lugar}/g, d.properties.nombre);
          }
          div.html(toolt);
          return ;
        }
        // double-touch
          $scope.mapControl.ajustar=true;
          establecerDescendiente(d, $scope.currentDpa, $scope.tiposDpa);
          $scope.currentDpa.dpaNombre = d.properties.nombre;
          if($scope.currentDpa.idDpa == d.properties.id_dpa){
            $scope.recargarMapa();
          }else{
            $scope.currentDpa.idDpa = d.properties.id_dpa;
          }
          //$scope.$apply();
        e.preventDefault(); // double tap - prevent the zoom
        return ;
      }
      var mousedown = function(d){
        mpos = [d3.event.pageX,d3.event.pageY];
      };
      var mouseup = function(d){
        if(mpos[0]==d3.event.pageX && mpos[1]==d3.event.pageY && !isTouch){
          $scope.mapControl.ajustar=true;
          establecerDescendiente(d, $scope.currentDpa, $scope.tiposDpa);
          $scope.currentDpa.dpaNombre = d.properties.nombre;
          if($scope.currentDpa.idDpa == d.properties.id_dpa){
            $scope.recargarMapa();
          }else{
            $scope.currentDpa.idDpa = d.properties.id_dpa;
          }
          //$scope.$apply();
        }
      };
      var click = function(d) {
        $scope.currentDpa.idDpa = d.properties.id_dpa;
        establecerDescendiente(d, $scope.currentDpa, $scope.tiposDpa);
        $scope.currentDpa.dpaNombre = d.properties.nombre;
        $scope.$apply();
      };

      // tooltip functions
      var mouseover = function(d) {
        if(!d || !isBurbujaEnabled() && d.properties.id_tipo_dpa==$scope.currentDpa.idTipoDpa) {
          div.transition()
             .duration(500)
             .style('opacity', 1);
        }
      };
      var mousemove = function(d) {
        if(d.properties.id_tipo_dpa==$scope.currentDpa.idTipoDpa) {
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
          if( d3.event.pageX > parseInt(d3.select('#mapa').style('width'))-parseInt(div.style('width')) ){
            div.style('left', (parseInt(div.style('left')) - parseInt(div.style('width'))) + 'px')
          }
          if( d3.event.pageY > parseInt(d3.select('body').style('height'))-parseInt(div.style('height')) ){
            div.style('top', (parseInt(div.style('top')) - parseInt(div.style('height'))) + 'px')
          }
          div.html(toolt);
        }
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
        var gana = partidoGanador(d, votos);
        var max = { porcentaje: 0 };
        votos.forEach(function(v) {
          if(d.properties.codigo === v.dpa_codigo) {
            v.partidos.forEach(function(p) {
              if (partido.id_partido === p.id_partido) {
                max = angular.copy(p);
                if(p.id_partido!=gana.id_partido){
                  max.color='ccc'; // Mostrar color solo en dpas ganadores
                }
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

      // Verifica si el partido seleccionado esta en vector partidos
      var verPartidoSeleccionado = function() {
        for(var i=0; i<$scope.partidos.length;i++) {
          if($scope.partidos[i].id_partido===partido.id_partido){
            return true;
          }
        }
        return false;
      }

      var setColorPartido = function(d, votos, partido) {
        var colorEscala, color;
        if(d.properties.id_tipo_dpa==$scope.currentDpa.idTipoDpa) {
          if (partido && verPartidoSeleccionado()) {
            d.partido = partidoSeleccionado(d, votos, partido);
            colorEscala = d3.scale.linear().domain([0, maximoPorcentaje(d, votos, partido, $scope.currentDpa)]);
          } else {
            d.partido = partidoGanador(d, votos);
            colorEscala = d3.scale.linear().domain([0, 60]);
          }
          return colorEscala.range(['white', '#' + (d.partido.color || ENV.color)])((d.partido.porcentaje+0.0001) || 100);
        }
        return '#bbb';
      };

      var hayDatos = function(d) {
        if(d.partido) {
          return d.partido.sigla==undefined?'opacity:0.1':'';
        }
      }
      /* Fin funciones necesarias */

      map.off('viewreset',reset,svg);
      d3.select(map.getPanes().overlayPane).selectAll('svg').remove();
      svg = d3.select(map.getPanes().overlayPane).append('svg');
      g = svg.append('g').attr('class', 'departamentos');

      svg.attr('class','leaflet-zoom-hide');

      var collection=$scope.data.data;

      var transform = d3.geo.transform({point: projectPoint}),
      path = d3.geo.path().projection(transform);

      var feature = g.selectAll('path')
          .data(collection.features)
        .enter().append('path')
          .attr('fill', function(d) { return setColorPartido(d, votos, partido); })
          .attr('class', function(d) { return 'departamento hover '+departamentoBurbuja(d)})
          .attr('style', function(d) { return hayDatos(d) })
          .on('dblclick',function(){ L.DomEvent.stopPropagation(d3.event); })
          .on('mouseover', function(d){ mouseover(d) })
          .on('mousemove', mousemove)
          .on('mouseout', mouseout)
          .on('touchstart',function(d){ countTouch(this,d); })
          .on('mousedown', mousedown)
          .on('mouseup', mouseup);
      // Reposition the SVG to cover the features.
      reset = function(b) {
        var escala=1;
        var bounds = path.bounds($scope.data.data),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        svg .attr('width', (bottomRight[0] - topLeft[0])*escala)
            .attr('height', (bottomRight[1] - topLeft[1])*escala)
            .style('overflow','visible')
            .style('left', topLeft[0] + 'px')
            .style('top', topLeft[1] + 'px');

        g   .attr('transform', 'translate(' + -topLeft[0]*escala + ',' + -topLeft[1]*escala + ')scale('+escala+')');

        feature.attr('d', path);

        g.selectAll('circle').remove();
        PanelFactory.maxRadio(votos,map.getZoom());
        if(isBurbujaEnabled()){
          circulos();
        }
        if($scope.mapControl.ajustar){
          $scope.centrarMapa();
          $scope.mapControl.ajustar=false;
        }
      }

      // Use Leaflet to implement a D3 geometric transformation.
      function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }

      circulos = function() {
        collection.features.forEach(function(p) {
          var punto = path.centroid(p);
          //if(punto[0] && p.partido.porcentaje>0 && p.partido.porcentaje<100 && p.properties.extent){
         if(p.properties.id_tipo_dpa==$scope.currentDpa.idTipoDpa) {
          if(punto[0] && p.partido.porcentaje>0 && p.partido.porcentaje<=100 ){
            g.append('circle')
                    .attr('fill','#'+p.partido.color)
                    .attr('stroke','#bbb')
                    .attr('opacity','.7')
                    .on('dblclick',function(){ L.DomEvent.stopPropagation(d3.event); })
                    .on('mouseover', function(d){ mouseover(d); })
                    .on('mousemove', function(){ mousemove(p); })
                    .on('mouseout', mouseout)
                    .on('touchstart',function(){ countTouch(this,p); })
                    .on('mousedown', function(){ mousedown(p); })
                    .on('mouseup', function(){ mouseup(p); })
                    .attr('class','circulo '+controlCirculoHide())
                    .attr('cx', punto[0])
                    .attr('cy', punto[1])
                    //.attr('r', ((0.250*Math.pow(2,map.getZoom()))* (p.partido.resultado/5000)/100  ));
                    .attr('r', PanelFactory.radioFromCant(p.partido.resultado,map.getZoom()) );
          }
         }
        });
        PanelFactory.changeLegend(map.getZoom());

      }
      map.on('viewreset', reset, svg);
      reset();

    };


    $scope.$watch('dpaGeoJSON', graficarMapa);
    $scope.$watch('partidoSeleccionado', graficarMapa);


  });
