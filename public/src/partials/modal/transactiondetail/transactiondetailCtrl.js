
angular.module('asch').controller('transactiondetailCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $translate) {

    $rootScope.transactiondetailinfo = false;

    $scope.Close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.transactiondetailinfo = false;
    };
    $rootScope.$on('transactiondetail', function (d, data) {
        $scope.id = data;
        apiService.transactiondetail({
            id: $scope.id
        }).success(function (res) {
            if (res.success == true) {
                $rootScope.transactiondetailinfo = true;
                $rootScope.isBodyMask = true;
				res.transaction.currency = res.transaction.currency === "" ? "ACC" : res.transaction.currency;
				res.transaction.message = res.transaction.message === "" ? $translate.instant('NONE_EXTRA_INFO') : res.transaction.message;
                $scope.transaction = res.transaction;
			};
        }).error(function () {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        })

    });
});

