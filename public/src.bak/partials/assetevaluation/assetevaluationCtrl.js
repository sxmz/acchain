angular.module('asch').controller('assetevaluationCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $window, NgTableParams,userService,postSerivice, $translate,$uibModal) {
    $rootScope.active = 'assetevaluation';
    $rootScope.userlogin = true;
    $rootScope.isBodyMask = false;
   	$scope.assetpending = true;
   	$rootScope.secpwd = !!userService.secondPublicKey;
   	$rootScope.showassetvoterInfo = function (i) {
   		$rootScope.blockdetailinfo = false;
        $rootScope.dealdetailinfo = false;
        $scope.i = i;
        $rootScope.$broadcast('assetvoter', $scope.i)
    }
   	$rootScope.showpublishvoterInfo = function (i) {
   		$rootScope.blockdetailinfo = false;
        $rootScope.dealdetailinfo = false;
        $scope.i = i;
        $rootScope.$broadcast('publishvoter', $scope.i)
    }
   	$rootScope.showassetdetailInfo = function (i) {
        $rootScope.blockdetailinfo = false;
        $rootScope.dealdetailinfo = false;
        $scope.i = i;
        $rootScope.$broadcast('assetdetail', $scope.i)
    }
   	/*
   	$scope.notallowed = function(i){
		i.btndisable = !i.btndisable;
	}
	*/
	$scope.votetoapply = function(i){
		$scope.voteDialog = true;
		$rootScope.isBodyMask = true;
		$scope.votecurrency = i;
        $scope.dialogNUM = 1;
    }
	$scope.votetopublish = function(i){
		$scope.voteDialog = true;
		$rootScope.isBodyMask = true;
		$scope.votetransaction = i;
        $scope.dialogNUM = 2;
    }
	$scope.pendingvoteClose = function(){
		$scope.voteDialog = false;
		$rootScope.isBodyMask = false;
	}
	$scope.vote_submit = function(){
		var trs ;
        if($scope.dialogNUM == 1){
            trs = AcchainJS.uia.createApproval(1, $scope.votecurrency, userService.secret, $scope.votesecondPassword);
		} else if($scope.dialogNUM == 2){
            trs = AcchainJS.uia.createApproval(2, $scope.votetransaction, userService.secret, $scope.votesecondPassword);
        }
        postSerivice.post(trs).success(function (res) {
            if (res.success == true) {
            	toast($translate.instant('INF_OPERATION_SUCCEEDED'));
                $scope.pendingvoteClose();
            } else {
                toastError(res.error)
            }
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
	}
    $scope.assetpendingchange = function () {
        $scope.assetpending = true;
        $scope.publishpending = false;
        $scope.assetapproved = false;
        $scope.tableparams = new NgTableParams({
            page: 1,
            count: 20,
            sorting: {
                height: 'desc'
            }
        }, {
                total: 0,
                counts: [],
                getData: function ($defer, params) {
                    apiService.assetPending({
                        limit: params.count(),
                        offset: (params.page() - 1) * params.count()
                    }).success(function (res) {
                        params.total(res.count);
                        $scope.assetpendingCount = res.count;
                        for (var i in res.assets) {
	                        var precision = res.assets[i].precision;
	                        res.assets[i].maximum = parseInt(res.assets[i].maximum) / Math.pow(10, precision);
	                    }
                       	$defer.resolve(res.assets);
                    }).error(function (res) {
                        toastError($translate.instant('ERR_SERVER_ERROR'));
                    });
                }
            });
    }
    $scope.publishpendingchange = function () {
        $scope.assetpending = false;
        $scope.publishpending = true;
        $scope.assetapproved = false;
        $scope.tableparams1 = new NgTableParams({
            page: 1,
            count: 20,
            sorting: {
                height: 'desc'
            }
        }, {
                total: 0,
                counts: [],
                getData: function ($defer, params) {
                    apiService.publishpending({
                        limit: params.count(),
                        offset: (params.page() - 1) * params.count()
                    }).success(function (res) {
                        params.total(res.count);
                        $scope.publishpendingCount = res.count;
                        for (var i in res.issues) {
	                        var precision = res.issues[i].precision;
	                        res.issues[i].amount = parseInt(res.issues[i].amount) / Math.pow(10, precision);
	                    }
                        $defer.resolve(res.issues);
                    }).error(function (res) {
                        toastError($translate.instant('ERR_SERVER_ERROR'));
                    });
                }
            });
    }
    $scope.assetapprovedchange = function () {
        $scope.assetpending = false;
        $scope.publishpending = false;
        $scope.assetapproved = true;
        $scope.tableparams2 = new NgTableParams({
            page: 1,
            count: 20,
            sorting: {
                height: 'desc'
            }
        }, {
                total: 0,
                counts: [],
                getData: function ($defer, params) {
                    apiService.assetApproved({
                        limit: params.count(),
                        offset: (params.page() - 1) * params.count()
                    }).success(function (res) {
                        params.total(res.count);
                        $scope.assetapprovedCount = res.assets.length;
                        for (var i in res.assets) {
	                        var precision = res.assets[i].precision;
	                        res.assets[i].maximum = parseInt(res.assets[i].maximum) / Math.pow(10, precision);
	                        res.assets[i].quantity = parseInt(res.assets[i].quantity) / Math.pow(10, precision);
	                    }
                        $defer.resolve(res.assets);
                    }).error(function (res) {
                        toastError($translate.instant('ERR_SERVER_ERROR'));
                    });
                }
            });
    };
    if ($scope.assetpending) {
        $scope.tableparams = new NgTableParams({
            page: 1,
            count: 20,
            sorting: {
                height: 'desc'
            }
        }, {
                total: 0,
                counts: [],
                getData: function ($defer, params) {
                    apiService.assetPending({
                        limit: params.count(),
                        offset: (params.page() - 1) * params.count()
                    }).success(function (res) {
                        params.total(res.count);
                        $scope.assetpendingCount = res.count;
                        for (var i in res.assets) {
	                        var precision = res.assets[i].precision;
	                        res.assets[i].maximum = parseInt(res.assets[i].maximum) / Math.pow(10, precision);
	                    }
                        $defer.resolve(res.assets);
                    }).error(function (res) {
                        toastError($translate.instant('ERR_SERVER_ERROR'));
                    });
                }
            });
    }
});
