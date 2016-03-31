'use strict';
/**
 * @ngdoc directive
 * @name geoelectoralFrontendApp.directive:resize
 * @description
 * # resizePanel
 */
angular.module('geoelectoralFrontendApp')
  .directive('resize', function ($window) {
      var iniMapa=true;
      return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            //$('.dropdown-submenu > a').submenupicker();
            return {'h': w.height(),'w': w.width()};
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            scope.anios_tipo = function () {
                return (newValue.w<768)?"dropdown-menu":"nav";
            };
            if(newValue.w<768){
                if(!scope.isSelected(1) && !scope.isSelected(2) && !scope.isSelected(3)){
                    scope.selectTab(4);
                }
                if(iniMapa){
                    iniMapa=false;
                    scope.selectTab(4);
                }
                scope.isMobile=function(){
                    return true;
                };
            }else{
                scope.selectTab(1);
            }
        }, true);
/*
        w.bind('resize', function () {
            scope.$apply();
        });
*/
      }
});

//   angular.element(document).ready(function() {
//     window.scrollTo(0,90);
// });