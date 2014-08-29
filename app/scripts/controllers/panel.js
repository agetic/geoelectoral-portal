'use strict';

/**
 * @ngdoc function
 * @name geoelectoralFrontendApp.controller:PanelCtrl
 * @description
 * # PanelCtrl
 * Controller of the geoelectoralFrontendApp
 */
angular.module('geoelectoralFrontendApp')
  .controller('PanelCtrl', function ($scope) {

    $scope.tab = 1;

    $scope.selectTab = function(setTab) {
      $scope.tab = setTab;
    };

    $scope.isSelected = function(checkTab) {
      return $scope.tab === checkTab;
    };
  });
