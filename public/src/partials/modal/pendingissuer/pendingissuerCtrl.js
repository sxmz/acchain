
angular.module('asch').controller('pendingissuerCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $translate) {

    $rootScope.pendingissuerInfo = false;

    $scope.Close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.pendingissuerInfo = false;
    };
    $rootScope.$on('pendingissuer', function (d, data) {
        $scope.address = data;
        console.log(data);
        apiService.issuer({
            address: $scope.address
        }).success(function (res) {
            if (res.success == true) {
                $rootScope.pendingissuerInfo = true;
                $rootScope.isBodyMask = true;
                $scope.issuer = res.issuer;
                console.log(res.issuer);
            };
        }).error(function () {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        })

    });
});

