
angular.module('asch').controller('assetdetailCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $translate) {

    $rootScope.assetdetailinfo = false;

    $scope.Close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.assetdetailinfo = false;
    };
    $rootScope.$on('assetdetail', function (d, data) {
        $scope.currency = data;
        apiService.assetdetail({
            currency: $scope.currency
        }).success(function (res) {
            if (res.success == true) {
                $rootScope.assetdetailinfo = true;
                $rootScope.isBodyMask = true;
                $scope.asset = res.asset;
                var extra = res.asset.extra;
                try{
                    var obj = JSON.parse(extra);
                    $scope.brand = !obj.productBrand.value ? $translate.instant('NONE_EXTRA_INFO') : obj.productBrand.value;
	                $scope.packing = !obj.packingStandard.value ? $translate.instant('NONE_EXTRA_INFO') : obj.packingStandard.value;
	                $scope.index = !obj.productIndex.value ? $translate.instant('NONE_EXTRA_INFO') : obj.productIndex.value;
	                $scope.production = !obj.productionInfo.value ? $translate.instant('NONE_EXTRA_INFO') : obj.productionInfo.value;
	                $scope.other = !obj.otherInfo.value ? $translate.instant('NONE_EXTRA_INFO') : obj.otherInfo.value;
                }catch(err){
                	return
                }
			};
        }).error(function () {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        })

    });
});

