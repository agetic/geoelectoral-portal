'use strict';

/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:breadCrumbs
 * @description
 * # breadCrumbs
 */
angular.module('geoelectoralFrontendApp')
  .directive('breadCrumbs', function ($log, BreadcrumbFactory) {

    return {
      restrict: 'A',
      template: '<ol class="breadcrumb"><li ng-repeat=\'bc in breadcrumbs\' ng-class="{\'active\': {{$last}} }"><a ng-click="unregisterBreadCrumb( $index )" ng-href="{{bc.href}}">{{bc.label}}</a></li></ol>',
      replace: true,
      compile: function(tElement, tAttrs) {
        return function($scope, $elem, $attr) {
          var bc_id = $attr['id'],
          resetCrumbs = function() {
            $scope.breadcrumbs = [];
            angular.forEach(BreadcrumbFactory.get(bc_id), function(v) {
              $scope.breadcrumbs.push(v);
            });
          };
          resetCrumbs();
          $scope.unregisterBreadCrumb = function( index ) {
            BreadcrumbFactory.setLastIndex(bc_id, index);
            resetCrumbs();
          };
          $scope.$on( 'breadcrumbsRefresh', function() {
            $log.log( "$on" );
            resetCrumbs();
          } );
        }
      }
    };

  });