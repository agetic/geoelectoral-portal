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
      template: '<ol class="breadcrumb"><li ng-repeat=\'bc in breadcrumbs\' ng-class="{\'active\': {{$last}} }"><a ng-click="unregisterBreadCrumb( $index )" ng-href="{{bc.href}}">{{bc.label}}</a><span><svg width="18" height="32" xmlns="http://www.w3.org/2000/svg"><g><g><path stroke-width="2" fill="#428bca" stroke="#ffffff" stroke-dasharray="null" stroke-linejoin="null" stroke-linecap="null" d="m0,-2l20,18l-20,18" /></g></g></svg></span></li></ol>',
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