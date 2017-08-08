
angular.module('asch').controller('assetvoterCtrl', function ($scope, $rootScope, NgTableParams, apiService, ipCookie, $location, $translate) {

    $rootScope.assetvoterinfo = false;

    $scope.Close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.assetvoterinfo = false;
        $scope.tableparams = null;
    };
    $rootScope.$on('assetvoter', function (d, data) {
    	$scope.currency = data;
       	apiService.assetvoter({
            currency: $scope.currency
        }).success(function (res) {
        	if (res.success == true) {
                $rootScope.assetvoterinfo = true;
                $rootScope.isBodyMask = true;
                $scope.votes = res.voters;
                $scope.votersCount = res.count
            };
        }).error(function () {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    });
    $rootScope.$on('publishvoter', function (d, data) {
    	$scope.id = data;
       	apiService.publishvoter({
            id: $scope.id
        }).success(function (res) {
        	if (res.success == true) {
                $rootScope.assetvoterinfo = true;
                $rootScope.isBodyMask = true;
                $scope.votes = res.voters;
                $scope.votersCount = res.voters.length;
            };
        }).error(function () {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    });
});

