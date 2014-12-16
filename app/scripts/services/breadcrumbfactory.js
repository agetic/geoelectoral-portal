'use strict';

/**
 * @ngdoc service
 * @name geoelectoralFrontendApp.BreadcrumbFactory
 * @description
 * # BreadcrumbFactory
 * Factory in the geoelectoralFrontendApp.
 */
angular.module('geoelectoralFrontendApp')
  .factory('BreadcrumbFactory', function ($rootScope, $log) {
    // Service logic
    var data = {};
    var ensureIdIsRegistered = function(id) {
      if (angular.isUndefined(data[id])) {
          data[id] = [];
      }
    };
    return {
      fromDpa: function(id, dpas, anio) {
        data[id] = [];
        dpas.forEach(function(d) {
          data[id].push({
            href: '#/elecciones/' + anio + '/dpa/' + d.id_dpa,
            label: d.nombre
          });
        });
        $rootScope.$broadcast( 'breadcrumbsRefresh' );
      },
      push: function(id, item) {
        var elem = null;
        ensureIdIsRegistered(id);
        data[id].some(function(d) {
          if (d.href === item.href) {
            elem = true;
            return true;
          };
        });
        if (elem === null) {
          data[id].push(item);
        };
        $log.log( "$broadcast" );
        $rootScope.$broadcast( 'breadcrumbsRefresh' );
      },
      get: function(id) {
        ensureIdIsRegistered(id);
        return angular.copy(data[id]);
      },
      setLastIndex: function( id, idx ) {
        ensureIdIsRegistered(id);
        if ( data[id].length > 1+idx ) {
          data[id].splice( 1+idx, data[id].length - idx );
          return true;
        }else{
          return false;
        }
      }
    };
  });
