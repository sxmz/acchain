angular.module('acchain').controller('personalCtrl', function ($scope, $rootScope, apiService, ipCookie, $window, $http, userService, postSerivice, $translate) {
	$rootScope.active = 'personal';
	$rootScope.userlogin = true;

	//下拉菜单隐藏
	// 账单默认显示
	$scope.accountInfo = true;
	$scope.passwordInfo = false;

	// 二级密码 $scope.secondpassword

	$scope.init = function (params) {
		apiService.account({
			address: userService.address
		}).success(function (res) {
			if (res.success == true) {
				$scope.account = res.account;
				$scope.latestBlock = res.latestBlock;
				$scope.version = res.version;
				userService.update(res.account);
				$scope.userService = userService;
			};

		}).error(function (res) {
			toastError(res.error);
		});
	};

	$scope.accountchange = function () {
		$scope.accountInfo = true;
		$scope.passwordInfo = !$scope.accountInfo;
	}
	$scope.passwordchange = function () {
		$scope.accountInfo = false;
		$scope.passwordInfo = !$scope.accountInfo;
	}

	$scope.setStatus = function () {
		var label = userService.secondPublicKey ? 'ALREADY_SET' : 'NOT_SET';
		return $translate.instant(label);
	}

	$scope.userService = userService;

	$scope.setPassWord = function () {
		var reg = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$/;
		if (!$scope.secondpassword || !$scope.confirmPassword) {
			return toastError($translate.instant('ERR_NO_SECND_PASSWORD'));;
		}
		var secondPwd = $scope.secondpassword.trim();
		var confirmPwd = $scope.confirmPassword.trim();
		if (secondPwd != confirmPwd) {
			toastError($translate.instant('ERR_TWO_INPUTS_NOT_EQUAL'));
		} else if (!reg.test(secondPwd)) {
			toastError($translate.instant('ERR_PASSWORD_INVALID_FORMAT'));
		} else if (reg.test(secondPwd) && reg.test(confirmPwd) && secondPwd == confirmPwd) {
			var transaction = AcchainJS.signature.createSignature(userService.secret, $scope.secondpassword);
			postSerivice.post(transaction).success(function (res) {
				if (res.success == true) {
					$scope.passwordsure = true;
					toast($translate.instant('INF_SECND_PASSWORD_SET_SUCCESS'));
				} else {
					toastError(res.error)
				};
			}).error(function (res) {
				toastError($translate.instant('ERR_SERVER_ERROR'));
			});
		}


	}
	// 退出函数
	$scope.quitout = function () {
	   window.localStorage.removeItem('secret');
	   window.localStorage.removeItem('address');
	   window.localStorage.removeItem('publicKey');
	   window.localStorage.removeItem('balance');
	   window.localStorage.removeItem('secondPublicKey');
       $window.location.href = '#/login';     
	}
});

