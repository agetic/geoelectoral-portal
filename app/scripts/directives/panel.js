'use strict';
/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:resize
 * @description
 * # resizePanel
 */
angular.module('geoelectoralFrontendApp')
  .directive('resize', function ($window) {
        return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            $('.dropdown-submenu > a').submenupicker();
            return {'h': w.height(),'w': w.width()};
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;

            scope.anios_columna = function(){
                return (newValue.w<768)?"":"col-xs-3";
            };
            scope.anios_tipo = function () {
                return (newValue.w<768)?"dropdown-menu":"nav";
            };
            scope.mapa_columna = function(){
                return (newValue.w<768)?"":"col-xs-9";
            };
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});

//   angular.element(document).ready(function() {
//     window.scrollTo(0,90);
// });