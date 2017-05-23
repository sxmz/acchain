angular.module('asch').controller('reduceaclCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $window, NgTableParams, userService,postSerivice, $translate) {
    $rootScope.userlogin = true;
    $rootScope.active = 'acl';
    $scope.comfirmDialog = false;
    $rootScope.secpwd = userService.secondPublicKey;
    $scope.updateAcl = function () {
        var currency = $rootScope.reduceACL.name;
        var flag = $rootScope.reduceACL.acl;
        var operator = '-'; // '+'表示增加， ‘-’表示删除
        var list = [] ;
        angular.forEach($rootScope.checkdelitem, function (data, index, array) {
            list.push(index);
        });
        console.log(list)
        if (!userService.secondPublicKey) {
            $scope.secondPassword = '';
        }
        $scope.reduceacltrs = AcchainJS.uia.createAcl(currency, operator, flag, list, userService.secret, $scope.secondPassword);
        $scope.comfirmDialog = true;
        $rootScope.isBodyMask = true;
    };
    $rootScope.checkdelitem = {};
    $scope.checkitem = function (i) {
            var key = i.address;
            if (!$rootScope.checkdelitem[key]) {
                $rootScope.checkdelitem[key] = i;
            } else {
                delete $rootScope.checkdelitem[key];
            }
    }
    $scope.comfirmDialogClose = function () {
        $rootScope.isBodyMask = false;
        $scope.comfirmDialog = false;
    };
    $scope.comfirmSub = function () {
        var trs = $scope.reduceacltrs;
        postSerivice.post(trs).success(function (res) {
            if (res.success == true) {
                $scope.secondPassword = ''
                toast($translate.instant('INF_OPERATION_SUCCEEDED'));
                $scope.comfirmDialogClose();
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    }
    $scope.init= function () {
        $scope.listparams = new NgTableParams({
            page: 1,
            count: 10,
            sorting: {
                height: 'desc'
            }
        }, {
            total: 0,
            counts: [],
            getData: function ($defer, params) {
                apiService.assetAcl({
                    name: $rootScope.reduceACL.name,
                    flag: $rootScope.reduceACL.acl,
                    limit: params.count(),
                    offset: (params.page() - 1) * params.count()
                }).success(function (res) {
                    //toast($translate.instant('INF_OPERATION_SUCCEEDED'));
                    params.total(res.count);
                    $defer.resolve(res.list);
                }).error(function (res) {
                    toastError($translate.instant('ERR_SERVER_ERROR'));
                });
            }
        });
    }
});
